// Functional tests for `rankDecks` — the Home-dashboard ranking that picks the
// featured "top performer" + the ordered remainder. Pure logic, run under
// Node's built-in test runner via `npm test`.
//
// Ranking: decks with >= minGames come first (win% desc, ties → more games),
// then decks below the threshold (games desc). `topQualifies` says whether the
// featured deck cleared the threshold (vs a most-played fallback).

import test from "node:test";
import assert from "node:assert/strict";

import {rankDecks, MIN_RANKED_GAMES} from "../context/deckStats.js";

function deck(id) {
  return {id, name: id, aspects: [], createdAt: 0};
}
// `w` wins + `l` losses for `deckId`, played vs Random (so they only count for
// that deck → its total === w + l, win% === w/(w+l)).
function gamesFor(deckId, w, l) {
  const out = [];
  for (let i = 0; i < w; i += 1) out.push({id: `${deckId}-w${i}`, playerDeckId: deckId, opponentDeckId: "__random__", outcome: "player_win", playedAt: i});
  for (let i = 0; i < l; i += 1) out.push({id: `${deckId}-l${i}`, playerDeckId: deckId, opponentDeckId: "__random__", outcome: "opponent_win", playedAt: i});
  return out;
}

test("rankDecks: no decks → null top, empty rest", () => {
  assert.deepEqual(rankDecks([], []), {top: null, rest: [], topQualifies: false});
  assert.deepEqual(rankDecks(undefined, undefined), {top: null, rest: [], topQualifies: false});
});

test("rankDecks: features the highest win% among decks past the threshold", () => {
  const decks = [deck("A"), deck("B"), deck("C")];
  const games = [
    ...gamesFor("A", 5, 1), // 6 games, ~83%
    ...gamesFor("B", 6, 4), // 10 games, 60%
    ...gamesFor("C", 3, 0) //  3 games, 100% but below MIN_RANKED_GAMES
  ];
  const {top, rest, topQualifies} = rankDecks(decks, games);
  assert.equal(top.id, "A"); // 83% beats 60%; C is below the threshold
  assert.equal(topQualifies, true);
  assert.deepEqual(rest.map((d) => d.id), ["B", "C"]); // ranked B, then unranked C
});

test("rankDecks: nobody past threshold → most-played is featured, topQualifies false", () => {
  const decks = [deck("A"), deck("B"), deck("C")];
  const games = [...gamesFor("A", 1, 1), ...gamesFor("B", 3, 1), ...gamesFor("C", 1, 0)]; // totals 2, 4, 1
  const {top, rest, topQualifies} = rankDecks(decks, games);
  assert.equal(top.id, "B"); // most played (4)
  assert.equal(topQualifies, false);
  assert.deepEqual(rest.map((d) => d.id), ["A", "C"]); // by games desc
});

test("rankDecks: win% ties break toward more games", () => {
  const decks = [deck("A"), deck("B")];
  const games = [...gamesFor("A", 6, 2), ...gamesFor("B", 9, 3)]; // both 75%, totals 8 and 12
  const {top, rest} = rankDecks(decks, games);
  assert.equal(top.id, "B"); // same 75%, more games
  assert.deepEqual(rest.map((d) => d.id), ["A"]);
});

test("rankDecks: a deck with no games sinks below played decks", () => {
  const decks = [deck("A"), deck("B")];
  const games = gamesFor("A", 5, 1); // A ranked; B has zero games
  const {top, rest, topQualifies} = rankDecks(decks, games);
  assert.equal(top.id, "A");
  assert.equal(topQualifies, true);
  assert.deepEqual(rest.map((d) => d.id), ["B"]);
});

test("rankDecks: ignores non-object deck entries", () => {
  const decks = [deck("A"), null, "x", 7];
  const {top, rest} = rankDecks(decks, gamesFor("A", 5, 1));
  assert.equal(top.id, "A");
  assert.deepEqual(rest, []);
});

test("rankDecks: MIN_RANKED_GAMES is a sane positive default", () => {
  assert.ok(Number.isInteger(MIN_RANKED_GAMES) && MIN_RANKED_GAMES >= 1);
});
