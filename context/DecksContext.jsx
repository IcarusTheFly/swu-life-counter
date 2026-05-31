import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DECKS_STORAGE_KEY,
  DECK_ID_PREFIX,
  GAMES_STORAGE_KEY,
  GAME_ID_PREFIX,
  MATCHUPS_STORAGE_KEY,
  MATCHUP_ID_PREFIX,
  OPPONENT_DECKS_STORAGE_KEY,
  PLAYER_DECKS_STORAGE_KEY,
  RANDOM_DECK_ID,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY
} from "../constants/decks";
import {migrateToV3} from "./migrations";
import {useSettings} from "./SettingsContext";

const DecksContext = createContext(null);

// Stable id generator. Format: `<prefix><ms-timestamp>_<random suffix>`. The
// random suffix is base-36 to keep it terse. Asserts the result never
// collides with `RANDOM_DECK_ID` — given the prefix plus the timestamp,
// collision is mathematically impossible but the check is cheap insurance.
function makeIdGenerator(prefix) {
  return function generate() {
    const id = prefix + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    if (id === RANDOM_DECK_ID) {
      // Unreachable — sentinel is the literal "__random__" string.
      throw new Error("id generator produced the reserved random sentinel");
    }
    return id;
  };
}

// v3 uses a SINGLE shared deck pool, so there is ONE deck-id generator.
export const generateDeckId = makeIdGenerator(DECK_ID_PREFIX);
export const generateMatchupId = makeIdGenerator(MATCHUP_ID_PREFIX);
export const generateGameId = makeIdGenerator(GAME_ID_PREFIX);

// Persist a JSON-serializable value under the given key. Fire-and-forget;
// failures are logged but never thrown — mirrors SettingsContext's policy.
function persist(key, value) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch((err) => {
    console.warn("[decks] failed to persist " + key, err);
  });
}

// Helper for the hydration path: parse a JSON string defensively, falling
// back to a provided default when the input is null/undefined or fails to
// parse. Used to keep the migration entry point compact.
function parseOr(stored, fallback) {
  if (stored === null || stored === undefined) return fallback;
  try {
    return JSON.parse(stored);
  } catch {
    return fallback;
  }
}

const SETTINGS_STORAGE_KEY = "@swu-life-counter:settings";

// Run the version-aware migration up to v3 with full defensive try/catch. On
// any error, fall back to fresh-install empty collections AND preserve the
// readable legacy keys (under a `-backup` suffix copy) so the user can
// recover via DevTools.
//
// Returns the v3 state object the provider should hold in memory PLUS a
// boolean indicating whether the migration succeeded enough to delete the
// legacy keys. When success is false, the legacy keys are left untouched.
async function runMigration(fromVersion) {
  try {
    // Read every key the composing migration might need. Missing keys read
    // as null and parse to `undefined` so `migrateToV3` defends per-slot.
    const [rawDecks, rawPlayerDecks, rawOpponentDecks, rawMatchups, rawGames, rawSettings] = await Promise.all([
      AsyncStorage.getItem(DECKS_STORAGE_KEY),
      AsyncStorage.getItem(PLAYER_DECKS_STORAGE_KEY),
      AsyncStorage.getItem(OPPONENT_DECKS_STORAGE_KEY),
      AsyncStorage.getItem(MATCHUPS_STORAGE_KEY),
      AsyncStorage.getItem(GAMES_STORAGE_KEY),
      AsyncStorage.getItem(SETTINGS_STORAGE_KEY)
    ]);

    const rawByKey = {
      [DECKS_STORAGE_KEY]: parseOr(rawDecks, undefined),
      [PLAYER_DECKS_STORAGE_KEY]: parseOr(rawPlayerDecks, undefined),
      [OPPONENT_DECKS_STORAGE_KEY]: parseOr(rawOpponentDecks, undefined),
      [MATCHUPS_STORAGE_KEY]: parseOr(rawMatchups, undefined),
      [GAMES_STORAGE_KEY]: parseOr(rawGames, undefined),
      [SETTINGS_STORAGE_KEY]: parseOr(rawSettings, null)
    };

    const {decks, matchups, games, settings, deletedLegacyKeys} = migrateToV3({rawByKey, fromVersion});

    // Write the v3 collections + version stamp BEFORE touching the legacy
    // keys. A crash here leaves the user with the source keys (intact) and
    // any partial v3 keys (orphan but inert because the version stamp hasn't
    // been written yet, so the next launch reruns the migration).
    await Promise.all([
      AsyncStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks)),
      AsyncStorage.setItem(MATCHUPS_STORAGE_KEY, JSON.stringify(matchups)),
      AsyncStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(games)),
      // Settings: only rewrite if we got an object back (i.e. there was a
      // settings blob to migrate). If none existed, leave the slot alone —
      // SettingsProvider writes defaults on first user action.
      settings !== null
        ? AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
        : Promise.resolve()
    ]);
    // Version stamp last — once written the next launch skips migration.
    await AsyncStorage.setItem(STORAGE_VERSION_KEY, JSON.stringify(STORAGE_VERSION));
    // Delete legacy keys only after every v3 write has succeeded.
    await Promise.all(deletedLegacyKeys.map((k) => AsyncStorage.removeItem(k)));

    return {decks, matchups, games, success: true};
  } catch (err) {
    console.warn("[decks] migration to v3 failed; falling back to fresh v3 defaults", err);
    // Best-effort: stash any readable legacy keys under suffixed names so the
    // user can recover via DevTools. Fire-and-forget — we already failed
    // once, don't compound the noise.
    try {
      await Promise.all(
        [DECKS_STORAGE_KEY, PLAYER_DECKS_STORAGE_KEY, OPPONENT_DECKS_STORAGE_KEY, GAMES_STORAGE_KEY].map(
          async (key) => {
            const raw = await AsyncStorage.getItem(key);
            if (raw !== null) await AsyncStorage.setItem(key + "-backup", raw);
          }
        )
      );
    } catch {
      /* ignore — backup is best-effort */
    }
    return {decks: [], matchups: [], games: [], success: false};
  }
}

export function DecksProvider({children}) {
  const [decks, setDecks] = useState([]);
  const [matchups, setMatchups] = useState([]);
  const [games, setGames] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  // Pull updateSettings so deleteDeck can cascade into the settings shape
  // (`defaultDeckId` falls back when its referenced deck is removed). The
  // SettingsProvider is guaranteed to be mounted above us — see App.jsx.
  const {settings, updateSettings} = useSettings();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Read the version stamp first. Missing OR < STORAGE_VERSION triggers
        // the migration path; equal-or-greater skips straight to the v3 read.
        const rawVersion = await AsyncStorage.getItem(STORAGE_VERSION_KEY);
        const version = parseOr(rawVersion, null);
        const needsMigration = typeof version !== "number" || version < STORAGE_VERSION;

        if (needsMigration) {
          const migrated = await runMigration(version);
          if (cancelled) return;
          setDecks(migrated.decks);
          setMatchups(migrated.matchups);
          setGames(migrated.games);
        } else {
          // Steady-state v3 read — a single shared `decks` key.
          const [rawDecks, rawMatchups, rawGames] = await Promise.all([
            AsyncStorage.getItem(DECKS_STORAGE_KEY),
            AsyncStorage.getItem(MATCHUPS_STORAGE_KEY),
            AsyncStorage.getItem(GAMES_STORAGE_KEY)
          ]);
          if (cancelled) return;
          const parsedDecks = parseOr(rawDecks, []);
          const parsedMatchups = parseOr(rawMatchups, []);
          const parsedGames = parseOr(rawGames, []);
          setDecks(Array.isArray(parsedDecks) ? parsedDecks : []);
          setMatchups(Array.isArray(parsedMatchups) ? parsedMatchups : []);
          setGames(Array.isArray(parsedGames) ? parsedGames : []);
        }
      } catch (err) {
        console.warn("[decks] failed to hydrate v3 collections, using empty lists", err);
        if (!cancelled) {
          setDecks([]);
          setMatchups([]);
          setGames([]);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- deck mutators ------------------------------------------------------

  const addDeck = useCallback((deckPartial) => {
    const newDeck = {
      id: generateDeckId(),
      name: "",
      aspects: [],
      leader: "",
      archetype: "",
      notes: "",
      ...deckPartial,
      createdAt: Date.now()
    };
    setDecks((prev) => {
      const next = [...prev, newDeck];
      persist(DECKS_STORAGE_KEY, next);
      return next;
    });
    return newDeck;
  }, []);

  const updateDeck = useCallback((id, partial) => {
    setDecks((prev) => {
      const next = prev.map((d) => (d.id === id ? {...d, ...partial, id: d.id} : d));
      persist(DECKS_STORAGE_KEY, next);
      return next;
    });
  }, []);

  // Hard delete with cascade: remove the deck, drop matchups + games that
  // reference it on EITHER side, and heal settings.defaultDeckId. The loadout
  // self-healing happens in App.jsx via the cross-validation effect.
  const deleteDeck = useCallback(
    (id) => {
      // Heal the default-deck pointer OUTSIDE the setState updater. Calling
      // another provider's setter from inside our own updater triggers
      // React's "cannot update a component while rendering a different
      // component" warning and double-fires under StrictMode. We derive the
      // next default from the current `decks` closure instead. (The M1 pattern.)
      if (settings.defaultDeckId === id) {
        const remainingDecks = decks.filter((d) => d.id !== id);
        updateSettings({defaultDeckId: remainingDecks.length > 0 ? remainingDecks[0].id : null});
      }
      setDecks((prev) => {
        const remaining = prev.filter((d) => d.id !== id);
        persist(DECKS_STORAGE_KEY, remaining);
        return remaining;
      });
      // Matchups reference a deck on EITHER side (directional notes), so drop
      // a matchup if the deleted deck is the player OR the opponent side.
      setMatchups((prev) => {
        const remaining = prev.filter((m) => m.playerDeckId !== id && m.opponentDeckId !== id);
        persist(MATCHUPS_STORAGE_KEY, remaining);
        return remaining;
      });
      // Games where the deck appears on EITHER side are removed (a mirror
      // self-test references the id on both sides).
      setGames((prev) => {
        const remaining = prev.filter((g) => g.playerDeckId !== id && g.opponentDeckId !== id);
        persist(GAMES_STORAGE_KEY, remaining);
        return remaining;
      });
    },
    [settings.defaultDeckId, updateSettings, decks]
  );

  // ---- matchup helpers ----------------------------------------------------

  const getMatchup = useCallback(
    (playerDeckId, opponentDeckId) =>
      matchups.find(
        (m) => m.playerDeckId === playerDeckId && m.opponentDeckId === opponentDeckId
      ) || null,
    [matchups]
  );

  // Create-or-update by (playerDeckId, opponentDeckId) pair. When a matching
  // record exists, merges the partial in and bumps `updatedAt`. When it
  // doesn't, builds a new record with empty defaults + the partial overlay.
  //
  // We compute the result + next array from the current `matchups` closure
  // (not inside a setState updater) so the RETURN VALUE is reliable — the
  // matchup-row inline editor consumes it synchronously. `matchups` is in the
  // dep array, so the closure is always current for a single edit per render
  // (the only way this is called). (The M3 pattern.)
  const upsertMatchup = useCallback(
    (playerDeckId, opponentDeckId, partial = {}) => {
      const idx = matchups.findIndex(
        (m) => m.playerDeckId === playerDeckId && m.opponentDeckId === opponentDeckId
      );
      const now = Date.now();
      let result;
      let next;
      if (idx >= 0) {
        result = {
          ...matchups[idx],
          ...partial,
          id: matchups[idx].id,
          playerDeckId,
          opponentDeckId,
          updatedAt: now
        };
        next = matchups.map((m, i) => (i === idx ? result : m));
      } else {
        result = {
          id: generateMatchupId(),
          playerDeckId,
          opponentDeckId,
          archetype: "",
          comments: "",
          createdAt: now,
          updatedAt: now,
          ...partial,
          // Re-enforce immutable identity after the spread.
          playerDeckId,
          opponentDeckId
        };
        next = [...matchups, result];
      }
      setMatchups(next);
      persist(MATCHUPS_STORAGE_KEY, next);
      return result;
    },
    [matchups]
  );

  // Convenience alias for callers that want a clearer semantic name
  // (e.g. the matchup-row inline editor calls this "update", not "upsert").
  const updateMatchup = upsertMatchup;

  // Directional matchup notes are keyed on the PLAYER side, so a deck's own
  // per-opponent notes are the matchups where it is the playerDeckId.
  const getMatchupsForDeck = useCallback(
    (deckId) => matchups.filter((m) => m.playerDeckId === deckId),
    [matchups]
  );

  // Internal helper: ensure a matchup exists for a (playerDeckId,
  // opponentDeckId) pair. Idempotent. Used by recordGame / bulkAddGames /
  // updateGame to auto-create matchups when the user logs games for a new
  // pair. Returns the matchup record.
  const ensureMatchup = useCallback((playerDeckId, opponentDeckId) => {
    let existing = null;
    setMatchups((prev) => {
      existing = prev.find(
        (m) => m.playerDeckId === playerDeckId && m.opponentDeckId === opponentDeckId
      );
      if (existing) return prev;
      const now = Date.now();
      const created = {
        id: generateMatchupId(),
        playerDeckId,
        opponentDeckId,
        archetype: "",
        comments: "",
        createdAt: now,
        updatedAt: now
      };
      existing = created;
      const next = [...prev, created];
      persist(MATCHUPS_STORAGE_KEY, next);
      return next;
    });
    return existing;
  }, []);

  // ---- game mutators ------------------------------------------------------

  // Append one game record. The opponent side MAY be `__random__` (a Random
  // game still counts for the player deck — see deckStats). Auto-creates a
  // matchup if one doesn't exist for the pair. The v3 outcome enum is
  // `"player_win" | "opponent_win" | "draw"`.
  const recordGame = useCallback(
    ({playerDeckId, opponentDeckId, outcome, comment, event}) => {
      const newGame = {
        id: generateGameId(),
        playerDeckId,
        opponentDeckId,
        outcome,
        playedAt: Date.now()
      };
      if (typeof comment === "string" && comment.length > 0) newGame.comment = comment;
      if (typeof event === "string" && event.length > 0) newGame.event = event;
      setGames((prev) => {
        const next = [...prev, newGame];
        persist(GAMES_STORAGE_KEY, next);
        return next;
      });
      ensureMatchup(playerDeckId, opponentDeckId);
      return newGame;
    },
    [ensureMatchup]
  );

  // Patch an existing game record. If the (playerDeckId, opponentDeckId) pair
  // changes and no matchup exists for the new pair, auto-create one. Does NOT
  // bump any `updatedAt` field (we don't track this on games). Computes from
  // the current `games` closure so the return value is reliable (the M3
  // pattern — the game-edit screen consumes it synchronously).
  const updateGame = useCallback(
    (id, partial) => {
      const idx = games.findIndex((g) => g.id === id);
      if (idx < 0) return null;
      const updated = {...games[idx], ...partial, id: games[idx].id};
      const next = games.map((g, i) => (i === idx ? updated : g));
      setGames(next);
      persist(GAMES_STORAGE_KEY, next);
      if (updated.playerDeckId && updated.opponentDeckId) {
        ensureMatchup(updated.playerDeckId, updated.opponentDeckId);
      }
      return updated;
    },
    [games, ensureMatchup]
  );

  // Hard delete one game record. Does NOT delete the corresponding matchup —
  // matchups persist independently for the user's strategic notes.
  const deleteGame = useCallback((id) => {
    setGames((prev) => {
      const next = prev.filter((g) => g.id !== id);
      persist(GAMES_STORAGE_KEY, next);
      return next;
    });
  }, []);

  // Generate `wins + losses + draws` game records for one (playerDeckId,
  // opponentDeckId) pair. Order: wins first, then losses, then draws.
  // `playedAt` is `playedAtBase + i` (0-indexed) so the records sort
  // deterministically. Auto-creates the matchup once for the whole batch.
  // Returns the array of created records.
  const bulkAddGames = useCallback(
    ({playerDeckId, opponentDeckId, wins, losses, draws, comment, event, playedAtBase}) => {
      const w = Math.max(0, Math.floor(wins || 0));
      const l = Math.max(0, Math.floor(losses || 0));
      const d = Math.max(0, Math.floor(draws || 0));
      const total = w + l + d;
      if (total <= 0) return [];
      const base = typeof playedAtBase === "number" ? playedAtBase : Date.now();
      const records = [];
      let offset = 0;
      const optional = {};
      if (typeof comment === "string" && comment.length > 0) optional.comment = comment;
      if (typeof event === "string" && event.length > 0) optional.event = event;
      const pushRecord = (outcome) => {
        records.push({
          id: generateGameId(),
          playerDeckId,
          opponentDeckId,
          outcome,
          playedAt: base + offset,
          ...optional
        });
        offset += 1;
      };
      for (let i = 0; i < w; i += 1) pushRecord("player_win");
      for (let i = 0; i < l; i += 1) pushRecord("opponent_win");
      for (let i = 0; i < d; i += 1) pushRecord("draw");
      setGames((prev) => {
        const next = [...prev, ...records];
        persist(GAMES_STORAGE_KEY, next);
        return next;
      });
      ensureMatchup(playerDeckId, opponentDeckId);
      return records;
    },
    [ensureMatchup]
  );

  // ---- selectors ----------------------------------------------------------

  const getDeckById = useCallback(
    (id) => decks.find((d) => d.id === id) || null,
    [decks]
  );

  // Pairwise lookup helper exposed to consumers — sugar over `matchups`.
  const getMatchupByPair = getMatchup;
  // Filter games by pair — used by the GamesScreen with optional opponent
  // filter, by the matchup-row stats card on Deck Detail, etc.
  const getGamesByPair = useCallback(
    (playerDeckId, opponentDeckId) =>
      games.filter(
        (g) => g.playerDeckId === playerDeckId && g.opponentDeckId === opponentDeckId
      ),
    [games]
  );

  // Render nothing until the persisted v3 collections have loaded. Mirrors
  // SettingsProvider's hydration gate so consumers can rely on stable initial
  // state.
  if (!hydrated) {
    return null;
  }

  return (
    <DecksContext.Provider
      value={{
        // collections
        decks,
        matchups,
        games,
        // deck mutators
        addDeck,
        updateDeck,
        deleteDeck,
        // matchup helpers
        getMatchup,
        getMatchupByPair,
        upsertMatchup,
        updateMatchup,
        getMatchupsForDeck,
        ensureMatchup,
        // game mutators
        recordGame,
        updateGame,
        deleteGame,
        bulkAddGames,
        // selectors
        getDeckById,
        getGamesByPair,
        // id generators (exported for screens that pre-allocate ids)
        generateDeckId,
        generateMatchupId,
        generateGameId
      }}
    >
      {children}
    </DecksContext.Provider>
  );
}

export function useDecks() {
  const ctx = useContext(DecksContext);
  if (!ctx) {
    throw new Error("useDecks must be used inside a DecksProvider");
  }
  return ctx;
}
