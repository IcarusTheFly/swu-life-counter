import test from "node:test";
import assert from "node:assert/strict";
import {homeHeaderModel} from "../context/deckStats.js";

// The Home metallic header bar derives its three cells (Decks / Games / Top
// Deck) from `homeHeaderModel`. These cover the counts and — importantly — the
// placeholder logic the header renders: no decks → `topDeck: null` (the UI
// shows "—"); a deck that ranks but has no games → name present, `hasGames:
// false` (no misleading record); an unnamed deck → "Untitled deck".

const game = (p, o, outcome, t) => ({playerDeckId: p, opponentDeckId: o, outcome, playedAt: t});
const RANDOM = "__random__";

test("homeHeaderModel: populated library surfaces counts and a clear top deck", () => {
  const decks = [{id: "a", name: "Alpha"}, {id: "b", name: "Bravo"}];
  const games = [
    game("a", RANDOM, "player_win", 1),
    game("a", RANDOM, "player_win", 2),
    game("a", RANDOM, "player_win", 3),
    game("a", RANDOM, "player_win", 4),
    game("a", RANDOM, "player_win", 5),
    game("a", RANDOM, "opponent_win", 6),
    game("b", RANDOM, "player_win", 7)
  ];
  const m = homeHeaderModel(decks, games);
  assert.equal(m.deckCount, 2);
  assert.equal(m.gameCount, 7);
  assert.ok(m.topDeck, "expected a top deck");
  assert.equal(m.topDeck.id, "a");
  assert.equal(m.topDeck.name, "Alpha");
  assert.equal(m.topDeck.hasGames, true);
  assert.equal(m.topDeck.stats.wins, 5);
  assert.equal(m.topDeck.stats.losses, 1);
});

test("homeHeaderModel: empty library → zero counts and no top deck (UI shows —)", () => {
  const m = homeHeaderModel([], []);
  assert.equal(m.deckCount, 0);
  assert.equal(m.gameCount, 0);
  assert.equal(m.topDeck, null);
});

test("homeHeaderModel: decks but no games → top deck present with hasGames=false", () => {
  const decks = [{id: "a", name: "Alpha"}, {id: "b", name: "Bravo"}];
  const m = homeHeaderModel(decks, []);
  assert.equal(m.deckCount, 2);
  assert.equal(m.gameCount, 0);
  assert.ok(m.topDeck, "a most-played fallback deck is still surfaced");
  assert.equal(m.topDeck.hasGames, false);
  assert.equal(m.topDeck.stats.total, 0);
});

test("homeHeaderModel: an unnamed top deck falls back to 'Untitled deck'", () => {
  const m = homeHeaderModel([{id: "x"}], []);
  assert.ok(m.topDeck);
  assert.equal(m.topDeck.name, "Untitled deck");
});

test("homeHeaderModel: garbage input never throws and returns a safe shape", () => {
  for (const args of [[null, null], [undefined, undefined], ["nope", "nope"], [[{id: "x", name: "X"}], "notarray"]]) {
    const m = homeHeaderModel(args[0], args[1]);
    assert.equal(typeof m.deckCount, "number");
    assert.equal(typeof m.gameCount, "number");
    assert.ok(m.topDeck === null || typeof m.topDeck.name === "string");
  }
});
