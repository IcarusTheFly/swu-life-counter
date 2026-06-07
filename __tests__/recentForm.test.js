// Functional tests for the Home sparkline helper `recentForm` and the shared
// numbers-only `formatRecord`. Pure logic, run under Node's test runner.

import test from "node:test";
import assert from "node:assert/strict";

import {recentForm, formatRecord} from "../context/deckStats.js";

// Game record: only the side ids + outcome + playedAt matter here.
function g(id, playedAt, player, opponent, outcome) {
  return {id, playedAt, playerDeckId: player, opponentDeckId: opponent, outcome};
}
const R = "__random__";

test("recentForm: no games / bad input → empty", () => {
  assert.deepEqual(recentForm("a", []), []);
  assert.deepEqual(recentForm("a", undefined), []);
  assert.deepEqual(recentForm("a", null), []);
});

test("recentForm: single game → one point (+1 / -1 / 0)", () => {
  assert.deepEqual(recentForm("a", [g("1", 1, "a", R, "player_win")]), [1]);
  assert.deepEqual(recentForm("a", [g("1", 1, "a", R, "opponent_win")]), [-1]);
  assert.deepEqual(recentForm("a", [g("1", 1, "a", R, "draw")]), [0]);
});

test("recentForm: all wins rises, all losses falls", () => {
  const wins = [g("1", 1, "a", R, "player_win"), g("2", 2, "a", R, "player_win"), g("3", 3, "a", R, "player_win")];
  assert.deepEqual(recentForm("a", wins), [1, 2, 3]);
  const losses = [g("1", 1, "a", R, "opponent_win"), g("2", 2, "a", R, "opponent_win")];
  assert.deepEqual(recentForm("a", losses), [-1, -2]);
});

test("recentForm: draws are flat steps", () => {
  const games = [g("1", 1, "a", R, "player_win"), g("2", 2, "a", R, "draw"), g("3", 3, "a", R, "opponent_win")];
  assert.deepEqual(recentForm("a", games), [1, 1, 0]); // +1, +0, -1
});

test("recentForm: respects the limit and keeps the MOST RECENT games", () => {
  const games = [];
  for (let i = 0; i < 5; i += 1) games.push(g("L" + i, i, "a", R, "opponent_win")); // old: 5 losses
  for (let i = 0; i < 3; i += 1) games.push(g("W" + i, 10 + i, "a", R, "player_win")); // recent: 3 wins
  const pts = recentForm("a", games, 3);
  assert.equal(pts.length, 3);
  assert.deepEqual(pts, [1, 2, 3]); // the 3 recent wins, not the old losses
});

test("recentForm: orders by playedAt regardless of array order", () => {
  const games = [g("late", 3, "a", R, "opponent_win"), g("early", 1, "a", R, "player_win"), g("mid", 2, "a", R, "player_win")];
  assert.deepEqual(recentForm("a", games), [1, 2, 1]); // W, W, L chronologically
});

test("recentForm: ignores malformed records and games not involving the deck", () => {
  const games = [g("1", 1, "a", R, "player_win"), null, {outcome: "bogus"}, g("2", 2, "x", "y", "player_win")];
  assert.deepEqual(recentForm("a", games), [1]);
});

test("formatRecord: always three numbers (W-L-D), never letters", () => {
  assert.equal(formatRecord({wins: 15, losses: 5, draws: 2}), "15-5-2");
  assert.equal(formatRecord({wins: 8, losses: 3, draws: 0}), "8-3-0"); // draws shown even when 0
  assert.equal(formatRecord({wins: 0, losses: 0, draws: 0}), "0-0-0");
  assert.equal(formatRecord(undefined), "0-0-0");
  assert.ok(!/[WLD]/.test(formatRecord({wins: 1, losses: 2, draws: 3})));
});
