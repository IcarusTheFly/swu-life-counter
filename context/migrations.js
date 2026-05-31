// Pure-JS storage migration helpers.
//
// Exercised from the Node test runner — no React imports, no AsyncStorage
// imports. The DecksProvider is responsible for the AsyncStorage I/O around
// these helpers (read the persisted keys, write the migrated keys, delete the
// legacy keys on success).
//
// Migration map: v1 → v2 (see the archived `enhance-deck-tracking`):
//   - `decks` array  →  `playerDecks` (same field shape, no new fields)
//   - `opponentDecks` initialized to `[]` (no auto-creation from games)
//   - `matchups` initialized to `[]` — auto-created on demand by recordGame
//   - `games`: per-record rename
//       `player1DeckId` → `playerDeckId`
//       `player2DeckId` → `opponentDeckId`
//       outcome enum:
//         `"player1_win"` → `"player_win"`
//         `"player2_win"` → `"opponent_win"`
//         `"draw"`        → `"draw"`
//       `comment`/`event` left undefined (filled by the user later)
//   - settings: rename `defaultDeckId` → `defaultPlayerDeckId`
//
// Migration map: v2 → v3 (this change, `refine-deck-tracking`):
//   - `playerDecks` + `opponentDecks`  →  a single shared `decks` list
//     (concatenated, then deduped by id — the two v2 collections used
//     disjoint id prefixes `pdeck_`/`odeck_`, so a real collision can't
//     happen; the dedupe is belt-and-suspenders).
//   - `matchups` + `games` preserved verbatim (their ids resolve against the
//     merged list; the `{playerDeckId, opponentDeckId}` shape is unchanged).
//   - settings: rename `defaultPlayerDeckId` → `defaultDeckId`.
//   - the v2 `playerDecks` / `opponentDecks` storage keys are reported in
//     `deletedLegacyKeys` so the caller deletes them after a successful write.
//
// Composition: `migrateToV3` is the single entry point the provider calls. It
// brings ANY source version (missing/v1/v2) up to the v3 shape by chaining
// v1 → v2 → v3 (the v1 → v2 step is a structural no-op for the `decks` list
// since v1's single list lands in `playerDecks` and then merges straight back
// into `decks`; the field renames + version semantics still flow through).
//
// Idempotency: the per-record mappers accept BOTH the older and newer shapes,
// and `migrateToV3` over already-v3 data passes records through unchanged
// (the merge is a concat-of-[decks]+[] and the settings rename is a no-op
// when the new key is already present). No records are dropped on a re-run.
//
// Defensive posture: this module never throws. Malformed input on any one
// collection short-circuits to fresh-install defaults for that collection
// only — the rest still migrates. The DecksProvider wraps the whole flow
// in a try/catch as a second line of defense.

import {
  DECKS_STORAGE_KEY,
  GAMES_STORAGE_KEY,
  MATCHUPS_STORAGE_KEY,
  OPPONENT_DECKS_STORAGE_KEY,
  PLAYER_DECKS_STORAGE_KEY
} from "../constants/decks.js";

// Normalize an outcome string to the v2 enum, accepting BOTH v1 and v2
// inputs. This makes the migration idempotent: re-running it over a record
// that already carries a v2 outcome (e.g. after a partially-applied
// migration that wrote games but not the version stamp) passes the value
// through unchanged instead of corrupting it. Truly-unknown values fall
// through to "draw" (the most-neutral persistable outcome).
function normalizeOutcome(outcome) {
  // v2 values pass straight through.
  if (outcome === "player_win" || outcome === "opponent_win" || outcome === "draw") {
    return outcome;
  }
  // v1 values roll forward.
  if (outcome === "player1_win") return "player_win";
  if (outcome === "player2_win") return "opponent_win";
  return "draw";
}

// Map one game record to the v2 shape. Accepts both the v1 shape
// (`player1DeckId` / `player2DeckId`) and the v2 shape (`playerDeckId` /
// `opponentDeckId`) — the latter so a re-run over already-migrated data is
// a no-op rather than a data-loss event (see M2 in the code review). A
// record missing deck ids in BOTH shapes is dropped (returns null).
//
// We intentionally do NOT repair partial records beyond the field rename —
// better to drop a corrupted row than persist a half-migrated frankenstein.
function migrateGameRecord(game) {
  if (!game || typeof game !== "object") return null;
  // Resolve deck ids from whichever shape the record is in. v2 fields win
  // when present so an already-v2 record round-trips unchanged.
  const playerDeckId =
    typeof game.playerDeckId === "string"
      ? game.playerDeckId
      : typeof game.player1DeckId === "string"
        ? game.player1DeckId
        : null;
  const opponentDeckId =
    typeof game.opponentDeckId === "string"
      ? game.opponentDeckId
      : typeof game.player2DeckId === "string"
        ? game.player2DeckId
        : null;
  if (playerDeckId === null || opponentDeckId === null) return null;
  const next = {
    id: typeof game.id === "string" ? game.id : "game_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
    playerDeckId,
    opponentDeckId,
    outcome: normalizeOutcome(game.outcome),
    playedAt: typeof game.playedAt === "number" ? game.playedAt : 0
  };
  // Preserve optional v2 fields when present (forward-rolled records).
  if (typeof game.comment === "string") next.comment = game.comment;
  if (typeof game.event === "string") next.event = game.event;
  return next;
}

// Validate a v1 deck record. v1 had `{id, name, aspects, leader, notes,
// createdAt}` — every field maps 1:1 to a v2 playerDeck record. The
// optional `archetype` field is left undefined (the user fills it later).
function migrateDeckRecord(deck) {
  if (!deck || typeof deck !== "object") return null;
  if (typeof deck.id !== "string" || typeof deck.name !== "string") return null;
  return {
    id: deck.id,
    name: deck.name,
    aspects: Array.isArray(deck.aspects) ? deck.aspects : [],
    leader: typeof deck.leader === "string" ? deck.leader : "",
    notes: typeof deck.notes === "string" ? deck.notes : "",
    // archetype is a v2-only field — leave undefined.
    createdAt: typeof deck.createdAt === "number" ? deck.createdAt : Date.now()
  };
}

// Migrate the settings blob's deck-related fields. Other settings fields
// (color, life, animations, haptics, loadout) are NOT touched here — the
// SettingsContext's `sanitize` already tolerates the v1 shape and reads
// the legacy `defaultDeckId` once during the migration window. We do
// rename the key in the persisted blob so future reads land directly on
// `defaultPlayerDeckId` without dipping into the legacy fallback.
//
// Returns a new object — never mutates the input.
function migrateSettings(settings) {
  if (!settings || typeof settings !== "object") return null;
  const next = {...settings};
  if ("defaultDeckId" in next) {
    // Preserve the value under the new name unless the new name already
    // exists (the new name wins, matching the sanitize layer's policy).
    if (!("defaultPlayerDeckId" in next)) {
      next.defaultPlayerDeckId = next.defaultDeckId;
    }
    delete next.defaultDeckId;
  }
  return next;
}

// Main entry point. Accepts the raw v1 blobs (already JSON-parsed by the
// caller) and returns the v2-shaped collections + a list of legacy keys
// the caller should delete from AsyncStorage after a successful write.
//
// Inputs:
//   decksRaw:    parsed v1 `@swu-life-counter:decks`    (Array | anything)
//   gamesRaw:    parsed v1 `@swu-life-counter:games`    (Array | anything)
//   settingsRaw: parsed v1 `@swu-life-counter:settings` (Object | null)
//
// Outputs:
//   {
//     playerDecks:   Array,   // migrated from decksRaw
//     opponentDecks: Array,   // empty — opponentDecks didn't exist in v1
//     matchups:      Array,   // empty — matchups didn't exist in v1
//     games:         Array,   // migrated from gamesRaw
//     settings:      Object,  // migrated from settingsRaw (or null if input null)
//     deletedLegacyKeys: Array<string> // keys the caller should delete
//   }
//
// Any input that doesn't pass shape checks falls back to a fresh
// collection for that slot. The caller wraps the whole helper in a
// try/catch as a second line of defense.
export function migrateStorageV1ToV2({decksRaw, gamesRaw, settingsRaw} = {}) {
  // PlayerDecks — accept arrays only; non-arrays become fresh empty.
  let playerDecks = [];
  if (Array.isArray(decksRaw)) {
    playerDecks = decksRaw.map(migrateDeckRecord).filter((d) => d !== null);
  }

  // OpponentDecks + matchups — always empty in a v1 source (those concepts
  // didn't exist). Auto-creation happens later when the user logs games.
  const opponentDecks = [];
  const matchups = [];

  // Games — accept arrays only.
  let games = [];
  if (Array.isArray(gamesRaw)) {
    games = gamesRaw.map(migrateGameRecord).filter((g) => g !== null);
  }

  // Settings — pass through null/undefined unchanged (SettingsContext
  // will fall back to defaults on next read). For real objects, rename
  // the deck-default key.
  const settings = settingsRaw === undefined || settingsRaw === null ? null : migrateSettings(settingsRaw);

  // The only key we ever delete during migration is the old decks array
  // — its contents have moved to PLAYER_DECKS_STORAGE_KEY. The games and
  // settings keys are rewritten in-place with the same names, just new
  // shapes.
  const deletedLegacyKeys = [DECKS_STORAGE_KEY];

  return {playerDecks, opponentDecks, matchups, games, settings, deletedLegacyKeys};
}

// ===========================================================================
// v2 → v3 — collapse the two-collection split back into one shared list.
// ===========================================================================

// Rename the settings deck-default key for v3: `defaultPlayerDeckId` →
// `defaultDeckId` (the reverse of the v1 → v2 rename). The new key WINS when
// both are present (matching the sanitize layer's read policy). Idempotent —
// a blob that already only has `defaultDeckId` round-trips unchanged.
//
// Returns a new object — never mutates the input.
function migrateSettingsV2ToV3(settings) {
  if (!settings || typeof settings !== "object") return null;
  const next = {...settings};
  if ("defaultPlayerDeckId" in next) {
    // Preserve the value under the new name unless the new name already
    // exists (the new name wins).
    if (!("defaultDeckId" in next)) {
      next.defaultDeckId = next.defaultPlayerDeckId;
    }
    delete next.defaultPlayerDeckId;
  }
  return next;
}

// Merge two deck collections into one, deduping by id. The v2 collections use
// disjoint prefixes (`pdeck_` / `odeck_`) so a real id collision can't occur;
// the dedupe is defensive (and makes a re-run over already-merged data a
// no-op rather than a duplication event). First occurrence wins on collision.
// Non-array inputs and malformed records are dropped for THAT slot only.
function mergeDecks(playerDecks, opponentDecks) {
  const seen = new Set();
  const merged = [];
  const pushAll = (list) => {
    if (!Array.isArray(list)) return;
    for (const deck of list) {
      if (!deck || typeof deck !== "object") continue;
      if (typeof deck.id !== "string") continue;
      if (seen.has(deck.id)) continue;
      seen.add(deck.id);
      merged.push(deck);
    }
  };
  pushAll(playerDecks);
  pushAll(opponentDecks);
  return merged;
}

// v2 → v3 entry point. Accepts the parsed v2 collections + settings and
// returns the v3-shaped single-list collections + the legacy keys to delete.
//
// Inputs (parsed; any may be malformed — each slot defends independently):
//   playerDecksRaw:   parsed v2 `@swu-life-counter:playerDecks`   (Array | anything)
//   opponentDecksRaw: parsed v2 `@swu-life-counter:opponentDecks` (Array | anything)
//   matchupsRaw:      parsed v2 `@swu-life-counter:matchups`      (Array | anything)
//   gamesRaw:         parsed v2 `@swu-life-counter:games`         (Array | anything)
//   settingsRaw:      parsed `@swu-life-counter:settings`         (Object | null)
//
// Outputs:
//   {
//     decks:    Array,   // playerDecks ++ opponentDecks, deduped by id
//     matchups: Array,   // preserved (ids resolve against the merged list)
//     games:    Array,   // preserved
//     settings: Object|null, // defaultPlayerDeckId → defaultDeckId
//     deletedLegacyKeys: [PLAYER_DECKS_STORAGE_KEY, OPPONENT_DECKS_STORAGE_KEY]
//   }
//
// Never throws. A malformed collection falls back to empty for that slot.
export function migrateStorageV2ToV3({
  playerDecksRaw,
  opponentDecksRaw,
  matchupsRaw,
  gamesRaw,
  settingsRaw
} = {}) {
  const decks = mergeDecks(playerDecksRaw, opponentDecksRaw);
  // Matchups + games are carried over verbatim — only valid arrays survive;
  // a malformed blob falls back to empty for that slot. We intentionally do
  // NOT re-map their records: the `{playerDeckId, opponentDeckId}` shape is
  // identical in v2 and v3, and their ids resolve against the merged list.
  const matchups = Array.isArray(matchupsRaw) ? matchupsRaw.filter((m) => m && typeof m === "object") : [];
  const games = Array.isArray(gamesRaw) ? gamesRaw.filter((g) => g && typeof g === "object") : [];
  const settings = settingsRaw === undefined || settingsRaw === null ? null : migrateSettingsV2ToV3(settingsRaw);
  const deletedLegacyKeys = [PLAYER_DECKS_STORAGE_KEY, OPPONENT_DECKS_STORAGE_KEY];
  return {decks, matchups, games, settings, deletedLegacyKeys};
}

// ===========================================================================
// Composing entry point — bring ANY source version up to the v3 shape.
// ===========================================================================

// `migrateToV3({rawByKey, fromVersion})` is the single function the
// DecksProvider calls on hydrate when the persisted version is missing OR
// `< 3`. It returns the v3 collections + the union of legacy keys to delete.
//
// `rawByKey` is a map of the ALREADY-PARSED persisted values, keyed by their
// AsyncStorage key constant. The provider parses + supplies whichever keys
// exist; missing keys are simply `undefined`. Recognized keys:
//   DECKS_STORAGE_KEY           — v1 single list (used when fromVersion < 2)
//   PLAYER_DECKS_STORAGE_KEY    — v2 player collection
//   OPPONENT_DECKS_STORAGE_KEY  — v2 opponent collection
//   MATCHUPS_STORAGE_KEY        — v2 matchups (passed through)
//   GAMES_STORAGE_KEY           — v1/v2 games
//   SETTINGS                    — the settings blob ("@swu-life-counter:settings")
//
// `fromVersion` is the parsed persisted version (a number, or null/undefined
// when never stamped — treated as v1, the original pre-versioning shape).
//
// Branch logic:
//   - fromVersion < 2 (or missing): the source is v1 (a single `decks` list
//     under DECKS_STORAGE_KEY). Run v1 → v2 to roll the game enum + field
//     renames forward and land the list in `playerDecks`, then v2 → v3 to
//     merge it straight back into the single `decks` list. The DECKS_STORAGE_KEY
//     is reported deletable by the v1 → v2 step BUT v3 rewrites that same key
//     with the merged list, so we drop it from the final delete set (see below).
//   - fromVersion === 2: the source is the two-collection shape. Run v2 → v3
//     directly on the v2 keys.
//   - fromVersion >= 3: already current. Still normalize through v2 → v3 so a
//     stray legacy key is folded in and the call is a safe no-op on records.
//
// Returns: {decks, matchups, games, settings, deletedLegacyKeys}.
export function migrateToV3({rawByKey = {}, fromVersion} = {}) {
  const SETTINGS_KEY = "@swu-life-counter:settings";
  const version = typeof fromVersion === "number" ? fromVersion : 0;

  if (version < 2) {
    // v1 (or unversioned) source → roll v1 → v2, then v2 → v3.
    const v2 = migrateStorageV1ToV2({
      decksRaw: rawByKey[DECKS_STORAGE_KEY],
      gamesRaw: rawByKey[GAMES_STORAGE_KEY],
      settingsRaw: rawByKey[SETTINGS_KEY]
    });
    const v3 = migrateStorageV2ToV3({
      playerDecksRaw: v2.playerDecks,
      opponentDecksRaw: v2.opponentDecks,
      matchupsRaw: v2.matchups,
      gamesRaw: v2.games,
      settingsRaw: v2.settings
    });
    // The v1 single-list key (DECKS_STORAGE_KEY) is ALSO the v3 single-list
    // key — v3 rewrites it with the merged list, so it must NOT be deleted.
    // Only the (never-written, but defensively cleared) v2 collection keys are
    // safe to delete on a v1 source.
    const deletedLegacyKeys = v3.deletedLegacyKeys.filter((k) => k !== DECKS_STORAGE_KEY);
    return {
      decks: v3.decks,
      matchups: v3.matchups,
      games: v3.games,
      settings: v3.settings,
      deletedLegacyKeys
    };
  }

  // v2 or v3 source → straight v2 → v3 (idempotent on v3 data).
  return migrateStorageV2ToV3({
    playerDecksRaw: rawByKey[PLAYER_DECKS_STORAGE_KEY],
    opponentDecksRaw: rawByKey[OPPONENT_DECKS_STORAGE_KEY],
    matchupsRaw: rawByKey[MATCHUPS_STORAGE_KEY],
    gamesRaw: rawByKey[GAMES_STORAGE_KEY],
    settingsRaw: rawByKey[SETTINGS_KEY]
  });
}
