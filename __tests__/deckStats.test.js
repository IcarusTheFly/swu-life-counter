// Tests for the pure-JS deck-stats helpers.
//
// Runs under Node's built-in test runner via `npm test`. The helpers in
// `context/deckStats.js` are React-free and operate over the game log
// records produced by DecksContext.recordGame — see the file header in
// `context/deckStats.js` for the record shape.
//
// v3 semantics (`refine-deck-tracking`) — SYMMETRIC stats over a SINGLE
// shared deck pool:
//   - A deck's stats count games where it is on EITHER side. As the player
//     side, `player_win` ⇒ Win; as the opponent side, the mirror.
//   - A deck chosen for BOTH sides (a mirror match) counts TWICE — one
//     entry per side (a decisive mirror = 1W + 1L; a drawn mirror = 2D).
//   - A `__random__` OPPONENT game counts for the (real) player deck and
//     surfaces under a single synthetic "Random" matchup row. `__random__`
//     is never a real deck id and accrues no record of its own.
//
// Conventions used in fixtures:
//   - Deck ids are short literal strings like "deck_a", "deck_b", ...
//   - `playedAt` uses small integers so the streak ordering is obvious; the
//     helpers sort by `playedAt` descending, NOT by array index.

import test from "node:test";
import assert from "node:assert/strict";

import {
  statsForDeck,
  matchupsForDeck,
  streakForDeck,
  eventsInGames,
  groupMatchupsByEvent,
  gamesGroupedByOpponent
} from "../context/deckStats.js";

// Small deck-record helper. Only `id` and `name` are read by the helpers;
// the other fields are filled to mirror real records.
function deck(id, name) {
  return {id, name, aspects: [], leader: "", notes: "", createdAt: 0};
}

// Game-record helper accepting the v1 enum (`"player1_win" | "player2_win" |
// "draw"`) for terse fixtures; emits the v3 record shape. The deck-side args
// map to v3 field names and the v1 enum maps forward.
function game(id, playedAt, playerDeckId, opponentDeckId, outcome) {
  const v3Outcome =
    outcome === "player1_win" ? "player_win" : outcome === "player2_win" ? "opponent_win" : outcome;
  return {id, playedAt, playerDeckId, opponentDeckId, outcome: v3Outcome};
}

// v3 game-record helper — outcome enum is `"player_win" | "opponent_win" | "draw"`.
function gameV3(id, playedAt, playerDeckId, opponentDeckId, outcome, extras) {
  return {id, playedAt, playerDeckId, opponentDeckId, outcome, ...(extras || {})};
}

// ---------------------------------------------------------------------------
// statsForDeck
// ---------------------------------------------------------------------------

test("statsForDeck: empty games array returns zero totals and null winPct", () => {
  const result = statsForDeck("deck_a", []);
  assert.deepEqual(result, {wins: 0, losses: 0, draws: 0, total: 0, winPct: null});
});

test("statsForDeck: 3 wins as player vs the same opponent → 3-0-0, 100%", () => {
  const games = [
    game("game_1", 1, "deck_a", "deck_b", "player1_win"),
    game("game_2", 2, "deck_a", "deck_b", "player1_win"),
    game("game_3", 3, "deck_a", "deck_b", "player1_win")
  ];
  assert.deepEqual(statsForDeck("deck_a", games), {
    wins: 3,
    losses: 0,
    draws: 0,
    total: 3,
    winPct: 100
  });
});

test("statsForDeck: player/opponent role is correctly inverted (1W as player + 1L as opponent → 1-1-0, 50%)", () => {
  // Deck A wins as the player side once, then loses as the opponent side once.
  // The helper must read the outcome from deck A's perspective in BOTH games.
  const games = [
    game("game_1", 1, "deck_a", "deck_b", "player1_win"), // A (player) wins
    game("game_2", 2, "deck_b", "deck_a", "player1_win") // B wins → A (opponent) loses
  ];
  assert.deepEqual(statsForDeck("deck_a", games), {
    wins: 1,
    losses: 1,
    draws: 0,
    total: 2,
    winPct: 50
  });
});

test("statsForDeck: mixed bag 2W + 1L + 1D → 2-1-1, 50%", () => {
  const games = [
    game("game_1", 1, "deck_a", "deck_b", "player1_win"), // A wins
    game("game_2", 2, "deck_b", "deck_a", "player1_win"), // A loses
    game("game_3", 3, "deck_a", "deck_b", "player1_win"), // A wins
    game("game_4", 4, "deck_a", "deck_b", "draw") // draw
  ];
  assert.deepEqual(statsForDeck("deck_a", games), {
    wins: 2,
    losses: 1,
    draws: 1,
    total: 4,
    winPct: 50
  });
});

test("statsForDeck (v3): a Random-opponent game counts for the real player deck", () => {
  // The opponent is the __random__ sentinel. In v3 this counts toward the
  // player deck (deck_a) — it is the only real side. The 2nd game has
  // __random__ on the PLAYER side (a shape the UI never writes) with deck_a
  // as opponent → deck_a is the real side and the result counts from its
  // (opponent) perspective: opponent_win ⇒ a Win for deck_a.
  const games = [
    gameV3("g1", 1, "deck_a", "__random__", "player_win"), // deck_a wins
    gameV3("g2", 2, "__random__", "deck_a", "opponent_win") // deck_a (opponent side) wins
  ];
  assert.deepEqual(statsForDeck("deck_a", games), {
    wins: 2,
    losses: 0,
    draws: 0,
    total: 2,
    winPct: 100
  });
});

test("statsForDeck (v3): a mirror match (deck on BOTH sides) counts twice", () => {
  // deck_a vs deck_a, player_win. Counts once per side: 1 Win (player side)
  // + 1 Loss (opponent side) = 1-1-0.
  const games = [gameV3("g1", 1, "deck_a", "deck_a", "player_win")];
  assert.deepEqual(statsForDeck("deck_a", games), {
    wins: 1,
    losses: 1,
    draws: 0,
    total: 2,
    winPct: 50
  });
});

test("statsForDeck (v3): a drawn mirror match counts as two draws", () => {
  const games = [gameV3("g1", 1, "deck_a", "deck_a", "draw")];
  assert.deepEqual(statsForDeck("deck_a", games), {
    wins: 0,
    losses: 0,
    draws: 2,
    total: 2,
    winPct: 0
  });
});

test("statsForDeck: winPct rounds to one decimal (3/7 → 42.9)", () => {
  const games = [
    game("game_1", 1, "deck_a", "deck_b", "player1_win"),
    game("game_2", 2, "deck_a", "deck_b", "player1_win"),
    game("game_3", 3, "deck_a", "deck_b", "player1_win"),
    game("game_4", 4, "deck_a", "deck_b", "player2_win"),
    game("game_5", 5, "deck_a", "deck_b", "player2_win"),
    game("game_6", 6, "deck_a", "deck_b", "player2_win"),
    game("game_7", 7, "deck_a", "deck_b", "player2_win")
  ];
  // 3 wins / 7 total = 0.428571… → 42.9
  assert.equal(statsForDeck("deck_a", games).winPct, 42.9);
});

test("statsForDeck: winPct rounds to one decimal (1/3 → 33.3)", () => {
  const games = [
    game("game_1", 1, "deck_a", "deck_b", "player1_win"),
    game("game_2", 2, "deck_a", "deck_b", "player2_win"),
    game("game_3", 3, "deck_a", "deck_b", "player2_win")
  ];
  assert.equal(statsForDeck("deck_a", games).winPct, 33.3);
});

// ---------------------------------------------------------------------------
// matchupsForDeck — v3 signature: (deckId, games, decks). Symmetric.
// ---------------------------------------------------------------------------

test("matchupsForDeck: empty games array returns []", () => {
  const decks = [deck("deck_a", "Deck A")];
  assert.deepEqual(matchupsForDeck("deck_a", [], decks), []);
});

test("matchupsForDeck (v3): a game A-vs-B appears on BOTH A's and B's matchups, mirrored", () => {
  // One game: A (player) beats B (opponent). A's matchup vs B reads 1-0-0;
  // B's matchup vs A reads 0-1-0 (the mirror).
  const games = [gameV3("g1", 1, "deck_a", "deck_b", "player_win")];
  const decks = [deck("deck_a", "Deck A"), deck("deck_b", "Deck B")];

  const aRows = matchupsForDeck("deck_a", games, decks);
  assert.equal(aRows.length, 1);
  assert.equal(aRows[0].opponentDeckId, "deck_b");
  assert.equal(aRows[0].opponentName, "Deck B");
  assert.deepEqual([aRows[0].wins, aRows[0].losses, aRows[0].draws], [1, 0, 0]);

  const bRows = matchupsForDeck("deck_b", games, decks);
  assert.equal(bRows.length, 1);
  assert.equal(bRows[0].opponentDeckId, "deck_a");
  assert.equal(bRows[0].opponentName, "Deck A");
  assert.deepEqual([bRows[0].wins, bRows[0].losses, bRows[0].draws], [0, 1, 0], "B sees the mirror: a loss vs A");
});

test("matchupsForDeck (v3): the deck on the OPPONENT side buckets by the player as the other side", () => {
  // deck_b only ever appears as the opponent side. Its matchups should still
  // surface deck_a as the other side, from deck_b's perspective.
  const games = [
    gameV3("g1", 1, "deck_a", "deck_b", "player_win"), // B loses to A
    gameV3("g2", 2, "deck_a", "deck_b", "opponent_win") // B beats A
  ];
  const decks = [deck("deck_a", "Deck A"), deck("deck_b", "Deck B")];
  const rows = matchupsForDeck("deck_b", games, decks);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].opponentDeckId, "deck_a");
  assert.deepEqual([rows[0].wins, rows[0].losses, rows[0].draws], [1, 1, 0]);
});

test("matchupsForDeck (v3): a Random-opponent game surfaces as a single 'Random' row", () => {
  const games = [
    gameV3("g1", 1, "deck_a", "__random__", "player_win"),
    gameV3("g2", 2, "deck_a", "__random__", "opponent_win"),
    gameV3("g3", 3, "deck_a", "__random__", "draw")
  ];
  const decks = [deck("deck_a", "Deck A")];
  const rows = matchupsForDeck("deck_a", games, decks);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].opponentDeckId, "__random__");
  assert.equal(rows[0].opponentName, "Random");
  assert.deepEqual([rows[0].wins, rows[0].losses, rows[0].draws], [1, 1, 1]);
  assert.equal(rows[0].total, 3);
});

test("matchupsForDeck (v3): matchup rows reconcile with the overall total (real + Random)", () => {
  // 2 games vs B + 3 games vs Random → rows (B + Random) sum to overall 5.
  const games = [
    gameV3("g1", 1, "deck_a", "deck_b", "player_win"),
    gameV3("g2", 2, "deck_a", "deck_b", "opponent_win"),
    gameV3("g3", 3, "deck_a", "__random__", "player_win"),
    gameV3("g4", 4, "deck_a", "__random__", "player_win"),
    gameV3("g5", 5, "deck_a", "__random__", "draw")
  ];
  const decks = [deck("deck_a", "Deck A"), deck("deck_b", "Deck B")];
  const rows = matchupsForDeck("deck_a", games, decks);
  const rowTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const overall = statsForDeck("deck_a", games);
  assert.equal(overall.total, 5);
  assert.equal(rowTotal, overall.total, "matchup rows must sum to the overall total");
  // Random row present.
  assert.ok(rows.some((r) => r.opponentDeckId === "__random__" && r.total === 3));
});

test("matchupsForDeck (v3): a mirror match yields a self-bucket reading 1-1-0", () => {
  // deck_a vs deck_a, player_win → both perspectives land in the self-bucket.
  const games = [gameV3("g1", 1, "deck_a", "deck_a", "player_win")];
  const decks = [deck("deck_a", "Deck A")];
  const rows = matchupsForDeck("deck_a", games, decks);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].opponentDeckId, "deck_a", "the other side is the deck itself (mirror)");
  assert.equal(rows[0].opponentName, "Deck A");
  assert.deepEqual([rows[0].wins, rows[0].losses, rows[0].draws], [1, 1, 0]);
  assert.equal(rows[0].total, 2, "mirror counts twice in its own bucket");
});

test("matchupsForDeck (v3): falls back to the bare id when the other deck record is missing", () => {
  // A game references an opponent id that isn't in the shared list (out-of-sync
  // state). The row falls back to the bare id as opponentName.
  const games = [gameV3("g1", 1, "deck_a", "deck_gone", "player_win")];
  const decks = [deck("deck_a", "Deck A")]; // deck_gone not present
  const rows = matchupsForDeck("deck_a", games, decks);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].opponentDeckId, "deck_gone");
  assert.equal(rows[0].opponentName, "deck_gone");
  assert.equal(rows[0].wins, 1);
});

test("matchupsForDeck (v3): sorted by total descending (5 games vs B, 2 vs C → B before C)", () => {
  const games = [
    game("g1", 1, "deck_a", "deck_b", "player1_win"),
    game("g2", 2, "deck_a", "deck_b", "player1_win"),
    game("g3", 3, "deck_a", "deck_b", "player2_win"),
    game("g4", 4, "deck_a", "deck_b", "draw"),
    game("g5", 5, "deck_a", "deck_b", "player1_win"),
    game("g6", 6, "deck_a", "deck_c", "player1_win"),
    game("g7", 7, "deck_a", "deck_c", "player2_win")
  ];
  const decks = [deck("deck_a", "Deck A"), deck("deck_b", "Deck B"), deck("deck_c", "Deck C")];
  const rows = matchupsForDeck("deck_a", games, decks);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].opponentDeckId, "deck_b");
  assert.equal(rows[0].total, 5);
  assert.equal(rows[1].opponentDeckId, "deck_c");
  assert.equal(rows[1].total, 2);
});

// ---------------------------------------------------------------------------
// streakForDeck
// ---------------------------------------------------------------------------

test("streakForDeck: empty games array returns null", () => {
  assert.equal(streakForDeck("deck_a", []), null);
});

test("streakForDeck: W-only — 3 most recent are wins → {kind: 'W', count: 3}", () => {
  const games = [
    game("g1", 1, "deck_a", "deck_b", "player1_win"),
    game("g2", 2, "deck_a", "deck_b", "player1_win"),
    game("g3", 3, "deck_a", "deck_b", "player1_win")
  ];
  assert.deepEqual(streakForDeck("deck_a", games), {kind: "W", count: 3});
});

test("streakForDeck: L-only — 2 most recent are losses → {kind: 'L', count: 2}", () => {
  const games = [
    game("g1", 1, "deck_a", "deck_b", "player2_win"),
    game("g2", 2, "deck_a", "deck_b", "player2_win")
  ];
  assert.deepEqual(streakForDeck("deck_a", games), {kind: "L", count: 2});
});

test("streakForDeck: draw in middle breaks the streak (W,W,D,W,W → {kind: 'W', count: 2})", () => {
  const games = [
    game("g1", 1, "deck_a", "deck_b", "player1_win"),
    game("g2", 2, "deck_a", "deck_b", "player1_win"),
    game("g3", 3, "deck_a", "deck_b", "draw"),
    game("g4", 4, "deck_a", "deck_b", "player1_win"),
    game("g5", 5, "deck_a", "deck_b", "player1_win")
  ];
  assert.deepEqual(streakForDeck("deck_a", games), {kind: "W", count: 2});
});

test("streakForDeck: most recent involving the deck is a draw → {kind: 'D', count: 1}", () => {
  const games = [
    game("g1", 1, "deck_a", "deck_b", "player1_win"),
    game("g2", 2, "deck_a", "deck_b", "player1_win"),
    game("g3", 3, "deck_a", "deck_b", "draw")
  ];
  assert.deepEqual(streakForDeck("deck_a", games), {kind: "D", count: 1});
});

test("streakForDeck: ignores games where the deck isn't involved", () => {
  const games = [
    game("g1", 1, "deck_a", "deck_b", "player1_win"), // A wins
    game("g2", 2, "deck_b", "deck_c", "player1_win"), // unrelated to A
    game("g3", 3, "deck_b", "deck_c", "player2_win"), // unrelated to A
    game("g4", 4, "deck_a", "deck_b", "player1_win") // A wins (most recent for A)
  ];
  assert.deepEqual(streakForDeck("deck_a", games), {kind: "W", count: 2});
});

test("streakForDeck (v3): a Random-opponent game IS included in the streak", () => {
  // The most recent game is vs __random__ and counts for deck_a. Both games
  // are wins → streak of 2.
  const games = [
    gameV3("g1", 1, "deck_a", "deck_b", "player_win"),
    gameV3("g2", 2, "deck_a", "__random__", "player_win")
  ];
  assert.deepEqual(streakForDeck("deck_a", games), {kind: "W", count: 2});
});

test("streakForDeck (v3): a mirror match contributes per-side entries (player-perspective first)", () => {
  // A single decisive mirror at the most-recent timestamp yields [W, L] in
  // newest-first order (player-perspective entry first by the documented
  // stable ordering). So the head of the streak is the player-perspective W
  // and the next entry (an L) breaks it → {kind: 'W', count: 1}.
  const games = [
    gameV3("g1", 1, "deck_a", "deck_b", "opponent_win"), // older: deck_a loses
    gameV3("g2", 2, "deck_a", "deck_a", "player_win") // newest: mirror → [W, L]
  ];
  assert.deepEqual(streakForDeck("deck_a", games), {kind: "W", count: 1});
});

// ---------------------------------------------------------------------------
// eventsInGames — distinct event strings sorted most-recent-use descending.
// ---------------------------------------------------------------------------

test("eventsInGames: empty array returns []", () => {
  assert.deepEqual(eventsInGames([]), []);
});

test("eventsInGames: games with no event tag set return []", () => {
  const games = [
    gameV3("g1", 1, "a", "b", "player_win"),
    gameV3("g2", 2, "a", "b", "player_win")
  ];
  assert.deepEqual(eventsInGames(games), []);
});

test("eventsInGames: returns distinct event strings sorted by most-recent-use", () => {
  const games = [
    gameV3("g1", 10, "a", "b", "player_win", {event: "PETRANAKI"}),
    gameV3("g2", 20, "a", "b", "player_win", {event: "LOCALS"}),
    gameV3("g3", 30, "a", "b", "player_win", {event: "PETRANAKI"}),
    gameV3("g4", 40, "a", "b", "player_win", {event: "FNM"})
  ];
  assert.deepEqual(eventsInGames(games), ["FNM", "PETRANAKI", "LOCALS"]);
});

test("eventsInGames: ignores empty-string event tags (treats as no tag)", () => {
  const games = [
    gameV3("g1", 10, "a", "b", "player_win", {event: ""}),
    gameV3("g2", 20, "a", "b", "player_win", {event: "PETRANAKI"})
  ];
  assert.deepEqual(eventsInGames(games), ["PETRANAKI"]);
});

test("eventsInGames: handles unsorted input — sorting is by playedAt, not array order", () => {
  const games = [
    gameV3("g3", 30, "a", "b", "player_win", {event: "PETRANAKI"}),
    gameV3("g1", 10, "a", "b", "player_win", {event: "LOCALS"}),
    gameV3("g2", 20, "a", "b", "player_win", {event: "FNM"})
  ];
  assert.deepEqual(eventsInGames(games), ["PETRANAKI", "FNM", "LOCALS"]);
});

// ---------------------------------------------------------------------------
// groupMatchupsByEvent — ordered {event, matchups} for the Deck Detail screen.
// Symmetric: includes games where the deck is on EITHER side.
// ---------------------------------------------------------------------------

test("groupMatchupsByEvent: no events in log → single ungrouped result (event: null)", () => {
  const games = [gameV3("g1", 1, "deck_a", "deck_b", "player_win")];
  const decks = [deck("deck_a", "Deck A"), deck("deck_b", "Deck B")];
  const groups = groupMatchupsByEvent("deck_a", games, decks);
  assert.ok(Array.isArray(groups));
  if (groups.length > 0) {
    assert.ok(
      groups.every((g) => g && (typeof g.event === "string" || g.event === null) && Array.isArray(g.matchups)),
      "each group must have {event, matchups[]}"
    );
  }
});

test("groupMatchupsByEvent: two distinct events partition matchups into two groups + Other", () => {
  const games = [
    gameV3("g1", 10, "deck_a", "deck_b", "player_win", {event: "PETRANAKI"}),
    gameV3("g2", 20, "deck_a", "deck_b", "opponent_win", {event: "PETRANAKI"}),
    gameV3("g3", 30, "deck_a", "deck_c", "player_win", {event: "LOCALS"}),
    gameV3("g4", 40, "deck_a", "deck_d", "player_win")
  ];
  const decks = [
    deck("deck_a", "Deck A"),
    deck("deck_b", "Boba4"),
    deck("deck_c", "Vader4"),
    deck("deck_d", "Jango")
  ];
  const groups = groupMatchupsByEvent("deck_a", games, decks);
  assert.equal(groups.length, 3, "should produce 3 groups (PETRANAKI, LOCALS, Other)");

  const byEvent = new Map(groups.map((g) => [g.event, g]));
  assert.ok(byEvent.has("PETRANAKI"));
  assert.ok(byEvent.has("LOCALS"));
  assert.ok(byEvent.has(null), "untagged games land under event: null");

  const petranaki = byEvent.get("PETRANAKI");
  assert.equal(petranaki.matchups.length, 1);
  assert.equal(petranaki.matchups[0].opponentDeckId, "deck_b");
  assert.equal(petranaki.matchups[0].total, 2);

  const locals = byEvent.get("LOCALS");
  assert.equal(locals.matchups.length, 1);
  assert.equal(locals.matchups[0].opponentDeckId, "deck_c");

  const other = byEvent.get(null);
  assert.equal(other.matchups.length, 1);
  assert.equal(other.matchups[0].opponentDeckId, "deck_d");
});

test("groupMatchupsByEvent: group order is most-recent-game-in-group descending, with Other last", () => {
  const games = [
    gameV3("g1", 10, "deck_a", "deck_d", "player_win"), // untagged
    gameV3("g2", 30, "deck_a", "deck_b", "player_win", {event: "PETRANAKI"}),
    gameV3("g3", 50, "deck_a", "deck_c", "player_win", {event: "LOCALS"})
  ];
  const decks = [
    deck("deck_a", "Deck A"),
    deck("deck_b", "Boba4"),
    deck("deck_c", "Vader4"),
    deck("deck_d", "Jango")
  ];
  const groups = groupMatchupsByEvent("deck_a", games, decks);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].event, "LOCALS", "LOCALS comes first (most-recent game at 50)");
  assert.equal(groups[1].event, "PETRANAKI", "PETRANAKI second (most-recent at 30)");
  assert.equal(groups[2].event, null, "Other group always last");
});

test("groupMatchupsByEvent (v3): a Random-opponent game surfaces as a Random row within its event group", () => {
  const games = [
    gameV3("g1", 10, "deck_a", "__random__", "player_win", {event: "TESTING"}),
    gameV3("g2", 20, "deck_a", "deck_b", "player_win", {event: "TESTING"})
  ];
  const decks = [deck("deck_a", "Deck A"), deck("deck_b", "Deck B")];
  const groups = groupMatchupsByEvent("deck_a", games, decks);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].event, "TESTING");
  const ids = groups[0].matchups.map((m) => m.opponentDeckId).sort();
  assert.deepEqual(ids, ["__random__", "deck_b"]);
  const randomRow = groups[0].matchups.find((m) => m.opponentDeckId === "__random__");
  assert.equal(randomRow.opponentName, "Random");
});

// ---------------------------------------------------------------------------
// gamesGroupedByOpponent — the Game History view ("won against X deck").
// A GAME LOG: each game appears once, grouped by opponent, from deckId's POV.
// ---------------------------------------------------------------------------

test("gamesGroupedByOpponent: empty / non-array games returns []", () => {
  assert.deepEqual(gamesGroupedByOpponent("deck_a", [], []), []);
  assert.deepEqual(gamesGroupedByOpponent("deck_a", null, []), []);
});

test("gamesGroupedByOpponent: groups games by opponent with W-L-D from the deck's POV", () => {
  const games = [
    gameV3("g1", 10, "deck_a", "deck_b", "player_win"),
    gameV3("g2", 20, "deck_a", "deck_b", "opponent_win"),
    gameV3("g3", 30, "deck_a", "deck_c", "player_win")
  ];
  const decks = [deck("deck_a", "Deck A"), deck("deck_b", "Deck B"), deck("deck_c", "Deck C")];
  const rows = gamesGroupedByOpponent("deck_a", games, decks);
  // Two opponent groups; B (2 games) before C (1 game) by total desc.
  assert.equal(rows.length, 2);
  assert.equal(rows[0].opponentDeckId, "deck_b");
  assert.equal(rows[0].opponentName, "Deck B");
  assert.deepEqual([rows[0].wins, rows[0].losses, rows[0].draws], [1, 1, 0]);
  assert.equal(rows[0].total, 2);
  assert.equal(rows[0].winPct, 50);
  assert.equal(rows[1].opponentDeckId, "deck_c");
  assert.deepEqual([rows[1].wins, rows[1].losses, rows[1].draws], [1, 0, 0]);
});

test("gamesGroupedByOpponent: inverts perspective when the deck is the OPPONENT side", () => {
  // deck_a is the opponent side here; an opponent_win is a WIN for deck_a.
  const games = [
    gameV3("g1", 10, "deck_b", "deck_a", "opponent_win"),
    gameV3("g2", 20, "deck_b", "deck_a", "player_win")
  ];
  const decks = [deck("deck_a", "Deck A"), deck("deck_b", "Deck B")];
  const rows = gamesGroupedByOpponent("deck_a", games, decks);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].opponentDeckId, "deck_b");
  assert.deepEqual([rows[0].wins, rows[0].losses, rows[0].draws], [1, 1, 0]);
});

test("gamesGroupedByOpponent: each game appears EXACTLY once, newest first", () => {
  const games = [
    gameV3("g1", 10, "deck_a", "deck_b", "player_win", {event: "LOCALS"}),
    gameV3("g2", 30, "deck_a", "deck_b", "opponent_win", {comment: "close one"}),
    gameV3("g3", 20, "deck_a", "deck_b", "draw")
  ];
  const decks = [deck("deck_a", "Deck A"), deck("deck_b", "Deck B")];
  const rows = gamesGroupedByOpponent("deck_a", games, decks);
  assert.equal(rows.length, 1);
  const log = rows[0].games;
  assert.equal(log.length, 3);
  // newest (playedAt desc): g2(30) > g3(20) > g1(10)
  assert.deepEqual(log.map((g) => g.id), ["g2", "g3", "g1"]);
  assert.deepEqual(log.map((g) => g.result), ["L", "D", "W"]);
  // optional fields carried through (and defaulted to "")
  assert.equal(log[0].comment, "close one");
  assert.equal(log[0].event, "");
  assert.equal(log[2].event, "LOCALS");
});

test("gamesGroupedByOpponent: a Random-opponent game surfaces under a 'Random' group", () => {
  const games = [
    gameV3("g1", 10, "deck_a", "__random__", "player_win"),
    gameV3("g2", 20, "deck_a", "deck_b", "player_win")
  ];
  const decks = [deck("deck_a", "Deck A"), deck("deck_b", "Deck B")];
  const rows = gamesGroupedByOpponent("deck_a", games, decks);
  const randomRow = rows.find((r) => r.opponentDeckId === "__random__");
  assert.ok(randomRow);
  assert.equal(randomRow.opponentName, "Random");
  assert.equal(randomRow.total, 1);
  assert.deepEqual([randomRow.wins, randomRow.losses, randomRow.draws], [1, 0, 0]);
});

test("gamesGroupedByOpponent: a mirror is logged ONCE (player perspective), not doubled", () => {
  const games = [gameV3("m1", 10, "deck_a", "deck_a", "player_win")];
  const decks = [deck("deck_a", "Deck A")];
  const rows = gamesGroupedByOpponent("deck_a", games, decks);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].opponentDeckId, "deck_a"); // self-group
  assert.equal(rows[0].games.length, 1); // ONE entry, not two
  assert.deepEqual([rows[0].wins, rows[0].losses, rows[0].draws], [1, 0, 0]);
});

test("gamesGroupedByOpponent: per-group W-L-D reconciles with statsForDeck (no mirrors)", () => {
  const games = [
    gameV3("g1", 10, "deck_a", "deck_b", "player_win"),
    gameV3("g2", 20, "deck_b", "deck_a", "opponent_win"), // deck_a wins as opponent
    gameV3("g3", 30, "deck_a", "__random__", "draw")
  ];
  const decks = [deck("deck_a", "Deck A"), deck("deck_b", "Deck B")];
  const rows = gamesGroupedByOpponent("deck_a", games, decks);
  const sum = rows.reduce(
    (acc, r) => ({w: acc.w + r.wins, l: acc.l + r.losses, d: acc.d + r.draws}),
    {w: 0, l: 0, d: 0}
  );
  const overall = statsForDeck("deck_a", games);
  assert.deepEqual([sum.w, sum.l, sum.d], [overall.wins, overall.losses, overall.draws]);
});

test("gamesGroupedByOpponent: skips games the deck isn't in, and unknown outcomes", () => {
  const games = [
    gameV3("g1", 10, "deck_b", "deck_c", "player_win"), // deck_a not involved
    gameV3("g2", 20, "deck_a", "deck_b", "bogus_outcome") // invalid outcome
  ];
  const decks = [deck("deck_a", "Deck A"), deck("deck_b", "Deck B"), deck("deck_c", "Deck C")];
  assert.deepEqual(gamesGroupedByOpponent("deck_a", games, decks), []);
});

test("gamesGroupedByOpponent: falls back to the bare id when the opponent record is missing", () => {
  const games = [gameV3("g1", 10, "deck_a", "ghost_deck", "player_win")];
  const rows = gamesGroupedByOpponent("deck_a", games, [deck("deck_a", "Deck A")]);
  assert.equal(rows[0].opponentName, "ghost_deck");
});

test("gamesGroupedByOpponent: does NOT crash when a game is missing a side id (corrupted record)", () => {
  // A game where opponentDeckId is undefined — should not throw even if there
  // are ≥2 groups (the sort comparator used to crash on undefined opponentName).
  const corruptGame = {id: "bad", playerDeckId: "deck_a", /* opponentDeckId missing */ outcome: "player_win", playedAt: 5};
  const normalGame = gameV3("g1", 10, "deck_a", "deck_b", "player_win");
  // Should return without throwing — both games reach the sort comparator.
  assert.doesNotThrow(() => gamesGroupedByOpponent("deck_a", [corruptGame, normalGame], [deck("deck_a","A"), deck("deck_b","B")]));
  const rows = gamesGroupedByOpponent("deck_a", [corruptGame, normalGame], [deck("deck_a","A"), deck("deck_b","B")]);
  // Both groups present; the one with a stringified "undefined" id is safe.
  assert.equal(rows.length, 2);
  assert.ok(rows.every(r => typeof r.opponentName === "string"));
});

test("gamesGroupedByOpponent: equal-total groups are ordered by opponent name ascending", () => {
  // Deck A has exactly 1 game vs B and 1 game vs C — both groups total=1; C < B alphabetically.
  const games = [
    gameV3("g1", 10, "deck_a", "deck_c", "player_win"),
    gameV3("g2", 20, "deck_a", "deck_b", "player_win")
  ];
  const decks = [deck("deck_a","Deck A"), deck("deck_b","Deck B"), deck("deck_c","Deck C")];
  const rows = gamesGroupedByOpponent("deck_a", games, decks);
  assert.equal(rows.length, 2);
  // "Deck B" before "Deck C" (b < c alphabetically ascending).
  assert.equal(rows[0].opponentName, "Deck B");
  assert.equal(rows[1].opponentName, "Deck C");
});
