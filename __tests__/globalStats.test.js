// Functional tests for `globalStats` — the cross-deck summary that feeds the
// Home stat strip (deck count · game count · overall win%). Pure logic, run
// under Node's built-in test runner via `npm test`.
//
// Semantics (see context/deckStats.js): a FLAT tally over the raw game log
// from the player's (your) perspective — each game counted ONCE: `player_win`
// ⇒ win, `opponent_win` ⇒ loss, `draw` ⇒ draw. Draws count in the denominator.
// Malformed / unknown records are ignored, so `gameCount` is the valid-game
// count. `winPct` is one-decimal, or `null` ONLY when there are no games.

import test from "node:test";
import assert from "node:assert/strict";

import {globalStats} from "../context/deckStats.js";

// Minimal game record: only `outcome` matters to globalStats, but we include
// the side ids to mirror the real record shape.
function g(outcome) {
  return {id: "g", playedAt: 0, playerDeckId: "a", opponentDeckId: "b", outcome};
}

test("globalStats: empty library → zero counts and null winPct (CTA signal)", () => {
  assert.deepEqual(globalStats([], []), {deckCount: 0, gameCount: 0, winPct: null});
});

test("globalStats: counts valid decks, ignores junk deck entries", () => {
  const decks = [{id: "a"}, {id: "b"}, {id: "c"}, null, "x", 7, undefined];
  assert.equal(globalStats(decks, []).deckCount, 3);
});

test("globalStats: non-array / garbage inputs are safe (never throws, never NaN)", () => {
  for (const bad of [undefined, null, "nope", 42, {}]) {
    const r = globalStats(bad, bad);
    assert.equal(r.deckCount, 0);
    assert.equal(r.gameCount, 0);
    assert.equal(r.winPct, null);
  }
});

test("globalStats: overall win% is player-perspective (player_win ⇒ win)", () => {
  const games = [g("player_win"), g("player_win"), g("player_win"), g("opponent_win"), g("draw")];
  const r = globalStats([{id: "a"}], games);
  assert.equal(r.gameCount, 5);
  assert.equal(r.winPct, 60); // 3 / 5
});

test("globalStats: win% rounds to one decimal", () => {
  const games = [g("player_win"), g("opponent_win"), g("opponent_win")];
  assert.equal(globalStats([], games).winPct, 33.3); // 1 / 3 = 33.33…
});

test("globalStats: draws count in the denominator (drag win% down)", () => {
  const r = globalStats([], [g("player_win"), g("draw")]);
  assert.equal(r.gameCount, 2);
  assert.equal(r.winPct, 50); // 1 win / (1 win + 1 draw)
});

test("globalStats: all draws → 0% WITH games (distinct from the null empty state)", () => {
  const r = globalStats([], [g("draw"), g("draw")]);
  assert.equal(r.gameCount, 2);
  assert.equal(r.winPct, 0); // a number, not null
});

test("globalStats: malformed / unknown-outcome records are ignored", () => {
  const games = [
    g("player_win"),
    g("draw"),
    {outcome: "bogus"}, // unknown enum
    {playerDeckId: "a"}, // no outcome
    null,
    5,
    "x"
  ];
  const r = globalStats([], games);
  assert.equal(r.gameCount, 2); // only the player_win + draw count
  assert.equal(r.winPct, 50); // 1 / 2
});
