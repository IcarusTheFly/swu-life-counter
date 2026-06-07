// Pure-JS stat-derivation helpers for the deck-tracking feature.
//
// No React, no AsyncStorage — these helpers exist as pure functions over a
// game-log array so the Node test runner (`npm test`) can exercise them
// without the Metro bundler.
//
// Game record shape (v3 — see DecksContext.recordGame):
//   {id, playerDeckId, opponentDeckId, outcome, playedAt, comment?, event?}
// Outcome enum: `"player_win" | "opponent_win" | "draw"`.
//
// SYMMETRIC stats (v3, `refine-deck-tracking`): there is one shared deck
// pool, and a single game `{playerDeckId, opponentDeckId, outcome}` is
// interpreted from EACH deck's own perspective. A deck's overall W-L-D,
// win%, streak, and matchups count games where it appears on EITHER side:
//   - As the player side: `player_win` ⇒ Win, `opponent_win` ⇒ Loss, draw ⇒ Draw.
//   - As the opponent side: the mirror (`opponent_win` ⇒ Win, etc.).
// A deck chosen for BOTH sides (a mirror match) counts TWICE — once per side
// (a decisive mirror contributes 1W + 1L; a drawn mirror contributes 2D).
//
// Random opponent: a game whose `opponentDeckId` is `RANDOM_DECK_ID`
// ("__random__") DOES count toward the (real) player deck — `__random__` is
// never a real deck id, so the only side it can affect is the player. It
// surfaces in that deck's matchups under a single synthetic "Random" row.
// `__random__` accrues no record of its own.

// Explicit `.js` extension so Node ESM picks this up cleanly under
// `npm test`. Same convention as `sanitize.js` and `migrations.js`.
import {RANDOM_DECK_ID} from "../constants/decks.js";

// Translate ONE game into the list of single-letter results it contributes
// to `deckId` — one entry per side `deckId` occupies in that game. This is
// the foundation of the symmetric "counts twice" rule:
//   - `deckId` on neither side                  → []        (not involved)
//   - `deckId` on exactly one side              → ["W"|"L"|"D"]
//   - `deckId` on BOTH sides (a mirror match)   → two entries
//
// For a mirror, the order is STABLE and documented: the player-perspective
// result first, then the opponent-perspective result. For a decisive mirror
// (`player_win`) that's ["W", "L"]; for `opponent_win` it's ["L", "W"]; for a
// draw it's ["D", "D"]. Consumers that care about chronological tie-breaking
// (e.g. `streakForDeck`) rely on this order.
//
// `RANDOM_DECK_ID` is never a real `deckId`, so a Random-opponent game yields
// exactly one entry (the player-side result) when `deckId` is the player.
function resultsForDeck(deckId, game) {
  if (!game || typeof game !== "object") return [];
  const out = [];
  const decisivePlayer =
    game.outcome === "player_win" ? "W" : game.outcome === "opponent_win" ? "L" : game.outcome === "draw" ? "D" : null;
  const decisiveOpponent =
    game.outcome === "opponent_win" ? "W" : game.outcome === "player_win" ? "L" : game.outcome === "draw" ? "D" : null;
  // Player-perspective entry first (stable mirror ordering).
  if (game.playerDeckId === deckId && decisivePlayer !== null) out.push(decisivePlayer);
  if (game.opponentDeckId === deckId && decisiveOpponent !== null) out.push(decisiveOpponent);
  return out;
}

// Resolve the display name for the "other side" of a game.
// Shared by `matchupsForDeck` and `gamesGroupedByOpponent` so the fallback
// logic stays in one place. Always returns a STRING — specifically handles:
//   - `RANDOM_DECK_ID` → "Random"
//   - a known deck id → the deck's name
//   - an unknown / undefined / null id → `String(id)` (the bare id, never throws)
// This defensiveness matters for corrupted/hand-edited records where a side id
// could be undefined; the sort comparators in both helpers call `.toLowerCase()`
// on the returned value and would crash on `undefined`.
function resolveOpponentName(id, deckList) {
  if (id === RANDOM_DECK_ID) return "Random";
  const found = Array.isArray(deckList) ? deckList.find((d) => d && d.id === id) : null;
  // Fall back to the bare id as a string; works for both missing records
  // (out-of-sync state or legacy id) AND for the undefined-side-id edge case.
  return found && typeof found.name === "string" ? found.name : String(id);
}

// Round a win percentage to one decimal place (e.g. 4/9 → 44.4). Returns
// null when the deck has no games — UI displays "–" or omits the field.
function computeWinPct(wins, total) {
  if (total <= 0) return null;
  return Math.round((wins / total) * 1000) / 10;
}

// Overall stats for a deck across the entire game log.
//   {wins, losses, draws, total, winPct}
// `winPct` is a number with one decimal (e.g. 42.9) or null when total=0.
//
// Symmetric: counts games where `deckId` is on EITHER side, and a mirror
// match (`deckId` on both sides) contributes two results.
export function statsForDeck(deckId, games) {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  if (Array.isArray(games)) {
    for (const game of games) {
      for (const r of resultsForDeck(deckId, game)) {
        if (r === "W") wins += 1;
        else if (r === "L") losses += 1;
        else if (r === "D") draws += 1;
      }
    }
  }
  const total = wins + losses + draws;
  return {wins, losses, draws, total, winPct: computeWinPct(wins, total)};
}

// Per-opponent matchup totals for a deck, from that deck's perspective.
// Returns an array of `{opponentDeckId, opponentName, wins, losses, draws,
// total, winPct}` sorted by `total` descending (ties broken by insertion
// order — deterministic because we iterate `games` once).
//
// SYMMETRIC bucketing (v3): every game where `deckId` is on EITHER side is
// counted, keyed by THE OTHER side's id:
//   - `deckId` is the player side  → bucket key = `opponentDeckId`
//     (may be `RANDOM_DECK_ID`).
//   - `deckId` is the opponent side → bucket key = `playerDeckId`.
//   - a mirror (`deckId` on both sides) → BOTH a player-perspective entry
//     (keyed by `deckId` itself) and an opponent-perspective entry (also
//     keyed by `deckId`) land in the SAME self-bucket, so a decisive mirror
//     reads 1-1-0 there. This realizes "counts twice" in the breakdown too.
//
// The `RANDOM_DECK_ID` opponent buckets under a single synthetic row
// `{opponentDeckId: "__random__", opponentName: "Random"}` aggregating all
// random-opponent games, so the rows always sum to the overall total.
//
// `decks` is the SINGLE shared deck list used to resolve names; when a
// bucket id doesn't resolve (out-of-sync state, or a legacy id), the row
// falls back to the bare id as `opponentName`.
export function matchupsForDeck(deckId, games, decks) {
  const buckets = new Map(); // otherSideId → {opponentDeckId, wins, losses, draws}
  const bump = (otherId, r) => {
    let bucket = buckets.get(otherId);
    if (!bucket) {
      bucket = {opponentDeckId: otherId, wins: 0, losses: 0, draws: 0};
      buckets.set(otherId, bucket);
    }
    if (r === "W") bucket.wins += 1;
    else if (r === "L") bucket.losses += 1;
    else bucket.draws += 1;
  };
  if (Array.isArray(games)) {
    for (const game of games) {
      if (!game || typeof game !== "object") continue;
      const isPlayer = game.playerDeckId === deckId;
      const isOpponent = game.opponentDeckId === deckId;
      if (!isPlayer && !isOpponent) continue;
      // Each side contributes its own perspective + its own "other side"
      // bucket. A mirror routes both into the self-bucket (other = deckId).
      const results = resultsForDeck(deckId, game);
      // `resultsForDeck` emits player-perspective first, then opponent. Map
      // each emitted entry back to the side that produced it so we bucket by
      // the correct "other side".
      let idx = 0;
      if (isPlayer && idx < results.length) {
        bump(game.opponentDeckId, results[idx]);
        idx += 1;
      }
      if (isOpponent && idx < results.length) {
        bump(game.playerDeckId, results[idx]);
        idx += 1;
      }
    }
  }
  const deckList = Array.isArray(decks) ? decks : [];
  const rows = [];
  for (const bucket of buckets.values()) {
    const total = bucket.wins + bucket.losses + bucket.draws;
    rows.push({
      opponentDeckId: bucket.opponentDeckId,
      opponentName: resolveOpponentName(bucket.opponentDeckId, deckList),
      wins: bucket.wins,
      losses: bucket.losses,
      draws: bucket.draws,
      total,
      winPct: computeWinPct(bucket.wins, total)
    });
  }
  rows.sort((a, b) => b.total - a.total);
  return rows;
}

// Walk the game log in reverse-chronological order (by `playedAt`) and count
// the streak of consecutive same-result games involving `deckId`. Returns
// `{kind: "W"|"L"|"D", count}` or null when the deck has no games.
//
// Symmetric + Random-aware (inherits from `resultsForDeck`). A mirror match
// contributes BOTH its per-side entries at the same `playedAt`; we keep the
// documented stable order (player-perspective first, then opponent) so a
// decisive mirror reads as [W, L] newest-first within that timestamp.
//
// We sort defensively in case the log is out of order — DecksContext appends
// new games but a future migration / merge could leave it unsorted. The sort
// is STABLE for equal `playedAt`, preserving the per-side emission order.
export function streakForDeck(deckId, games) {
  if (!Array.isArray(games) || games.length === 0) return null;
  const involved = [];
  for (const game of games) {
    const playedAt = typeof game.playedAt === "number" ? game.playedAt : 0;
    for (const r of resultsForDeck(deckId, game)) {
      involved.push({playedAt, r});
    }
  }
  if (involved.length === 0) return null;
  // Newest first. Array#sort in modern engines (and Node's V8) is stable, so
  // equal-`playedAt` entries keep their push order (player-perspective before
  // opponent-perspective for a mirror).
  involved.sort((a, b) => b.playedAt - a.playedAt);
  const kind = involved[0].r;
  let count = 0;
  for (const entry of involved) {
    if (entry.r === kind) count += 1;
    else break;
  }
  return {kind, count};
}

// Distinct event tags currently in use across the game log, sorted by
// most-recent-use descending. Used by the event-tag autocomplete on the
// Bulk Add and Game Edit screens. Drops untagged games + empty strings.
export function eventsInGames(games) {
  if (!Array.isArray(games)) return [];
  // Map of event string → max playedAt observed.
  const lastSeen = new Map();
  for (const game of games) {
    if (!game || typeof game !== "object") continue;
    const event = game.event;
    if (typeof event !== "string" || event.length === 0) continue;
    const playedAt = typeof game.playedAt === "number" ? game.playedAt : 0;
    const prev = lastSeen.get(event);
    if (prev === undefined || playedAt > prev) {
      lastSeen.set(event, playedAt);
    }
  }
  return [...lastSeen.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([event]) => event);
}

// Group matchups under event headers for the Deck Detail screen.
//
// Returns an ordered list of `{event: string|null, matchups: Array<...>}`
// — `event: null` is the trailing "Other" group for untagged games. Group
// order is most-recent-game-in-group descending. Within each group the
// matchup rows follow `matchupsForDeck`'s sort order (total descending).
//
// SYMMETRIC (v3): a game is included in this deck's grouping when `deckId` is
// on EITHER side; each event sub-call delegates to the symmetric
// `matchupsForDeck`, so a single opponent (or the Random row) can appear
// under multiple event groups, with W-L-D scoped to that event.
export function groupMatchupsByEvent(deckId, games, decks) {
  if (!Array.isArray(games)) games = [];
  // event key → {playedAtLatest, games: []}
  const eventBuckets = new Map();
  for (const game of games) {
    if (!game || typeof game !== "object") continue;
    // Include the game if `deckId` is on EITHER side (symmetric).
    if (game.playerDeckId !== deckId && game.opponentDeckId !== deckId) continue;
    const event = typeof game.event === "string" && game.event.length > 0 ? game.event : null;
    let bucket = eventBuckets.get(event);
    if (!bucket) {
      bucket = {playedAtLatest: 0, games: []};
      eventBuckets.set(event, bucket);
    }
    const playedAt = typeof game.playedAt === "number" ? game.playedAt : 0;
    if (playedAt > bucket.playedAtLatest) bucket.playedAtLatest = playedAt;
    bucket.games.push(game);
  }
  const groups = [];
  for (const [event, bucket] of eventBuckets.entries()) {
    const rows = matchupsForDeck(deckId, bucket.games, decks);
    groups.push({event, matchups: rows, _latest: bucket.playedAtLatest});
  }
  // Order: tagged groups by most-recent-game descending, then the "Other"
  // (event=null) group last regardless of timestamp.
  groups.sort((a, b) => {
    if (a.event === null && b.event !== null) return 1;
    if (a.event !== null && b.event === null) return -1;
    return b._latest - a._latest;
  });
  return groups.map(({event, matchups}) => ({event, matchups}));
}

// Group a deck's games by OPPONENT for the Game History screen — "show me my
// record, and every game, against deck X". Returns an ordered list of
// per-opponent groups:
//   {opponentDeckId, opponentName, wins, losses, draws, total, winPct,
//    games: [{id, result: "W"|"L"|"D", outcome, event, comment, playedAt}]}
//
// IMPORTANT — this is a GAME LOG, not symmetric stats. Unlike
// `statsForDeck`/`matchupsForDeck` (which count a mirror TWICE, once per
// side), each game appears EXACTLY ONCE here, keyed by its opponent, so the
// listed entries always sum to the group's W-L-D. For every non-mirror
// opponent the group's W-L-D therefore equals its matchup stats; a mirror
// (deck on both sides) lands in a self-group (opponentDeckId === deckId) with
// the player-perspective result, logged once.
//
// Result is from `deckId`'s perspective:
//   - deckId is the player side  → player_win = W, opponent_win = L, draw = D
//   - deckId is the opponent side → opponent_win = W, player_win = L, draw = D
// Games with an unrecognized `outcome` are skipped (same policy as the other
// helpers — they contribute nothing).
//
// Groups are ordered by total descending, then opponent name ascending. The
// synthetic Random opponent (RANDOM_DECK_ID) sorts as "Random" among the rest.
// Within a group, games are newest-first (playedAt descending, stable). `decks`
// resolves names; an unresolved id falls back to the bare id.
export function gamesGroupedByOpponent(deckId, games, decks) {
  if (!Array.isArray(games)) return [];
  const deckList = Array.isArray(decks) ? decks : [];
  const groups = new Map(); // opponentId → {opponentDeckId, opponentName, wins, losses, draws, games}
  for (const game of games) {
    if (!game || typeof game !== "object") continue;
    const isPlayer = game.playerDeckId === deckId;
    const isOpponent = game.opponentDeckId === deckId;
    if (!isPlayer && !isOpponent) continue;
    // Skip records whose outcome isn't part of the v3 enum.
    if (game.outcome !== "player_win" && game.outcome !== "opponent_win" && game.outcome !== "draw") {
      continue;
    }
    // A mirror (both sides) resolves via the player branch: opponent is the
    // deck itself, logged once with the player-perspective result.
    let opponentId;
    let result;
    if (isPlayer) {
      opponentId = game.opponentDeckId;
      result = game.outcome === "player_win" ? "W" : game.outcome === "opponent_win" ? "L" : "D";
    } else {
      opponentId = game.playerDeckId;
      result = game.outcome === "opponent_win" ? "W" : game.outcome === "player_win" ? "L" : "D";
    }
    let group = groups.get(opponentId);
    if (!group) {
      group = {opponentDeckId: opponentId, opponentName: resolveOpponentName(opponentId, deckList), wins: 0, losses: 0, draws: 0, games: []};
      groups.set(opponentId, group);
    }
    if (result === "W") group.wins += 1;
    else if (result === "L") group.losses += 1;
    else group.draws += 1;
    group.games.push({
      id: game.id,
      result,
      outcome: game.outcome,
      // Whether `deckId` was the playerDeckId in this raw game record.
      // Consumers (e.g. the edit form in GameHistoryScreen) need this to
      // translate a perspective result (W/L/D) back into the stored outcome
      // enum when saving edits — particularly to handle the draw ambiguity.
      isPlayerSide: isPlayer,
      event: typeof game.event === "string" ? game.event : "",
      comment: typeof game.comment === "string" ? game.comment : "",
      playedAt: typeof game.playedAt === "number" ? game.playedAt : 0
    });
  }
  const rows = [];
  for (const group of groups.values()) {
    // Newest game first within each opponent group (stable for equal stamps).
    group.games.sort((a, b) => b.playedAt - a.playedAt);
    const total = group.wins + group.losses + group.draws;
    rows.push({...group, total, winPct: computeWinPct(group.wins, total)});
  }
  rows.sort(
    (a, b) =>
      b.total - a.total ||
      a.opponentName.toLowerCase().localeCompare(b.opponentName.toLowerCase())
  );
  return rows;
}

// ── Global (cross-deck) stats for the Home stat strip ────────────────────────
// A single at-a-glance summary across the WHOLE library: how many decks, how
// many recorded games, and the overall win% from the player's (your) side.
//
// Unlike `statsForDeck` (symmetric, per-deck, counts a mirror twice), this is a
// flat tally over the raw game log from the PLAYER perspective — each game is
// counted ONCE: `player_win` ⇒ win, `opponent_win` ⇒ loss, `draw` ⇒ draw.
// (player1 / `playerDeckId` is "you" — the loadout convention.) Malformed
// records and unknown outcomes are ignored, so `gameCount` reflects only the
// valid games that contribute to the percentage.
//
// Returns `{deckCount, gameCount, winPct}`. `winPct` is a one-decimal number,
// or `null` when there are no games (the UI shows a call-to-action, not "0%").
// Garbage input (non-arrays, nulls, junk records) is handled safely — this
// never throws and never returns NaN.
export function globalStats(decks, games) {
  const deckCount = Array.isArray(decks)
    ? decks.filter((d) => d && typeof d === "object").length
    : 0;
  let wins = 0;
  let losses = 0;
  let draws = 0;
  if (Array.isArray(games)) {
    for (const game of games) {
      if (!game || typeof game !== "object") continue;
      if (game.outcome === "player_win") wins += 1;
      else if (game.outcome === "opponent_win") losses += 1;
      else if (game.outcome === "draw") draws += 1;
      // unknown / missing outcome → ignored (not a countable game)
    }
  }
  const gameCount = wins + losses + draws;
  return {deckCount, gameCount, winPct: computeWinPct(wins, gameCount)};
}

// ── Deck ranking for the Home dashboard ─────────────────────────────────────
// Minimum recorded games for a deck to be eligible for the "top performer"
// ranking — so a 1-0 deck can't out-rank a deck with a real sample.
export const MIN_RANKED_GAMES = 5;

// Rank decks for the Home dashboard. Returns `{top, rest, topQualifies}`:
//   - `top`          the featured deck (or null when there are no decks)
//   - `rest`         the remaining decks in ranked order
//   - `topQualifies` whether `top` met `minGames` (vs a most-played fallback)
//
// Ranking: decks with >= `minGames` games come FIRST, by win% descending (ties
// → more games); decks below the threshold follow, by games descending
// (most-played first). So when nobody qualifies, `top` is simply the most-played
// deck and `topQualifies` is false — the UI shows "needs more games" rather than
// a misleading 100%. Non-object entries are ignored. Win% reuses the symmetric
// per-deck `statsForDeck` (a deck counts on either side it appears).
export function rankDecks(decks, games, minGames = MIN_RANKED_GAMES) {
  const list = Array.isArray(decks) ? decks.filter((d) => d && typeof d === "object") : [];
  if (list.length === 0) return {top: null, rest: [], topQualifies: false};
  const withStats = list.map((d) => {
    const s = statsForDeck(d.id, games);
    return {deck: d, total: s.total, winPct: s.winPct == null ? -1 : s.winPct};
  });
  const ranked = withStats
    .filter((x) => x.total >= minGames)
    .sort((a, b) => b.winPct - a.winPct || b.total - a.total);
  const unranked = withStats
    .filter((x) => x.total < minGames)
    .sort((a, b) => b.total - a.total);
  const ordered = ranked.concat(unranked).map((x) => x.deck);
  return {top: ordered[0] || null, rest: ordered.slice(1), topQualifies: ranked.length > 0};
}

// ── Recent-form sparkline series ─────────────────────────────────────────────
// An ordered (oldest → newest) CUMULATIVE net-result series for a deck's last
// `limit` games — for the Home card Sparkline. Start at 0, then +1 per Win,
// −1 per Loss, +0 per Draw, computed over the windowed slice (so a rising line
// means the deck has been winning lately). Returns [] when the deck has no
// results. Symmetric + Random-aware (reuses `resultsForDeck`); sorts by
// `playedAt` (stable) before taking the most-recent tail.
export function recentForm(deckId, games, limit = 12) {
  if (!Array.isArray(games)) return [];
  const seq = [];
  for (const game of games) {
    const playedAt = game && typeof game.playedAt === "number" ? game.playedAt : 0;
    for (const r of resultsForDeck(deckId, game)) seq.push({playedAt, r});
  }
  if (seq.length === 0) return [];
  seq.sort((a, b) => a.playedAt - b.playedAt);
  const n = Math.max(1, Math.floor(limit) || 1);
  const recent = seq.slice(-n);
  let net = 0;
  return recent.map(({r}) => {
    if (r === "W") net += 1;
    else if (r === "L") net -= 1;
    return net;
  });
}

// Format a deck's record as NUMBERS ONLY, ALWAYS three of them — "15-5-2" /
// "8-3-0" (wins-losses-draws). The draw count is always shown (even `0`) so
// records read consistently. Never the "W-L-D" letters.
export function formatRecord(stats) {
  const w = (stats && stats.wins) || 0;
  const l = (stats && stats.losses) || 0;
  const d = (stats && stats.draws) || 0;
  return `${w}-${l}-${d}`;
}

// ── Home header model ────────────────────────────────────────────────────────
// The data behind the Home metallic header bar's three cells — derived once so
// the placeholder logic (empty library → no top deck; a ranked-but-gameless
// deck → name with no record) is pure and testable, independent of layout:
//   {deckCount, gameCount, topDeck: {id, name, stats, hasGames} | null}
// `topDeck` is null only when there are NO decks (the UI shows "—"); a deck with
// zero games still ranks (most-played fallback) but reports `hasGames: false`
// so the header shows its name without a misleading record. Safe on garbage
// input (never throws).
export function homeHeaderModel(decks, games) {
  const g = globalStats(decks, games);
  const ranking = rankDecks(decks, games);
  const top = ranking.top;
  const topStats = top ? statsForDeck(top.id, games) : null;
  return {
    deckCount: g.deckCount,
    gameCount: g.gameCount,
    topDeck: top
      ? {id: top.id, name: top.name || "Untitled deck", stats: topStats, hasGames: topStats.total > 0}
      : null
  };
}
