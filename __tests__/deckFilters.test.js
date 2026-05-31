// Tests for the pure deck-list filter + sort helpers (Decks "Filters" panel).
// Runs under Node's built-in test runner via `npm test`.

import test from "node:test";
import assert from "node:assert/strict";

import {
  EMPTY_FILTERS,
  SORT_NAME,
  SORT_GAMES,
  ORDER_ASC,
  ORDER_DESC,
  hasActiveFilters,
  activeFilterCount,
  distinctArchetypes,
  gamesCountForDeck,
  deckMatchesFilters,
  sortDecks,
  filterDecks
} from "../context/deckFilters.js";

function deck(id, name, aspects = [], archetype = "") {
  return {id, name, aspects, leader: "", archetype, notes: "", createdAt: 0};
}

const DECKS = [
  deck("d1", "Bossk Vigilance", ["Vigilance", "Villainy"], "Colossus"),
  deck("d2", "Quinlan Vos", ["Aggression", "Villainy"], "Tarkintown"),
  deck("d3", "Boba4", ["Cunning", "Villainy"], "Cunning"),
  deck("d4", "Luke Command", ["Command", "Heroism"], "")
];

// d1 has 1 game, d3 has 2 games (one vs Random), d2 + d4 have none.
const GAMES = [
  {id: "g1", playerDeckId: "d1", opponentDeckId: "d3", outcome: "player_win", playedAt: 1},
  {id: "g2", playerDeckId: "d3", opponentDeckId: "__random__", outcome: "player_win", playedAt: 2}
];

// Membership helper — filter via the predicate in INSERTION order (no sort).
const matching = (filters) => DECKS.filter((d) => deckMatchesFilters(d, filters)).map((d) => d.id);

// ---------------------------------------------------------------------------
// defaults + active counting (sort/order are NOT filters)
// ---------------------------------------------------------------------------

test("EMPTY_FILTERS defaults to name / ascending and is inactive", () => {
  assert.equal(EMPTY_FILTERS.sortBy, SORT_NAME);
  assert.equal(EMPTY_FILTERS.sortOrder, ORDER_ASC);
  assert.equal(hasActiveFilters(EMPTY_FILTERS), false);
  assert.equal(activeFilterCount(EMPTY_FILTERS), 0);
});

test("changing sort/order does NOT count as an active filter", () => {
  assert.equal(activeFilterCount({...EMPTY_FILTERS, sortBy: SORT_GAMES, sortOrder: ORDER_DESC}), 0);
  assert.equal(hasActiveFilters({...EMPTY_FILTERS, sortBy: SORT_GAMES}), false);
});

test("activeFilterCount counts search / aspects / archetypes (max 3)", () => {
  assert.equal(activeFilterCount({...EMPTY_FILTERS, search: "x"}), 1);
  assert.equal(
    activeFilterCount({...EMPTY_FILTERS, search: "x", aspects: ["Villainy"], archetypes: ["Cunning"]}),
    3
  );
});

test("whitespace-only search is not active; garbage tolerated", () => {
  assert.equal(hasActiveFilters({...EMPTY_FILTERS, search: "   "}), false);
  assert.equal(hasActiveFilters(null), false);
});

// ---------------------------------------------------------------------------
// deckMatchesFilters — search / aspects / archetypes (no `played` anymore)
// ---------------------------------------------------------------------------

test("no filter matches every deck", () => {
  assert.deepEqual(matching(EMPTY_FILTERS), ["d1", "d2", "d3", "d4"]);
  assert.equal(deckMatchesFilters(DECKS[0], null), true);
  assert.equal(deckMatchesFilters(null, {...EMPTY_FILTERS, search: "x"}), false);
});

test("search matches a name substring, case-insensitive + trimmed", () => {
  assert.deepEqual(matching({...EMPTY_FILTERS, search: "vos"}), ["d2"]);
  assert.deepEqual(matching({...EMPTY_FILTERS, search: "  BOBA "}), ["d3"]);
  assert.deepEqual(matching({...EMPTY_FILTERS, search: "zzz"}), []);
});

test("aspect filter matches ANY selected aspect (OR)", () => {
  assert.deepEqual(matching({...EMPTY_FILTERS, aspects: ["Villainy"]}), ["d1", "d2", "d3"]);
  assert.deepEqual(matching({...EMPTY_FILTERS, aspects: ["Command", "Cunning"]}), ["d3", "d4"]);
});

test("archetype filter matches ANY selected (case-insensitive); no-archetype deck excluded", () => {
  assert.deepEqual(matching({...EMPTY_FILTERS, archetypes: ["colossus"]}), ["d1"]);
  assert.deepEqual(matching({...EMPTY_FILTERS, archetypes: ["Colossus", "Cunning"]}), ["d1", "d3"]);
  assert.equal(matching({...EMPTY_FILTERS, archetypes: ["", "Tarkintown"]}).includes("d4"), false);
});

test("dimensions are ANDed together", () => {
  assert.deepEqual(matching({...EMPTY_FILTERS, aspects: ["Villainy"], search: "boba"}), ["d3"]);
  assert.deepEqual(matching({...EMPTY_FILTERS, aspects: ["Heroism"], archetypes: ["Colossus"]}), []);
});

// ---------------------------------------------------------------------------
// distinctArchetypes / gamesCountForDeck
// ---------------------------------------------------------------------------

test("distinctArchetypes: sorted, de-duped (ci), non-empty", () => {
  const decks = [deck("a", "A", [], "Colossus"), deck("b", "B", [], "tarkintown"), deck("c", "C", [], "TARKINTOWN"), deck("e", "E", [], "")];
  assert.deepEqual(distinctArchetypes(decks), ["Colossus", "tarkintown"]);
  assert.deepEqual(distinctArchetypes(null), []);
});

test("gamesCountForDeck counts each side (mirror twice, random once)", () => {
  assert.equal(gamesCountForDeck("d1", GAMES), 1);
  assert.equal(gamesCountForDeck("d3", GAMES), 2); // g1 (opponent) + g2 (player)
  assert.equal(gamesCountForDeck("d2", GAMES), 0);
  const mirror = [{id: "m", playerDeckId: "x", opponentDeckId: "x", outcome: "draw", playedAt: 1}];
  assert.equal(gamesCountForDeck("x", mirror), 2);
});

// ---------------------------------------------------------------------------
// sortDecks
// ---------------------------------------------------------------------------

const idsOf = (rows) => rows.map((d) => d.id);

test("sortDecks by name ascending (default) and descending", () => {
  // Boba4, Bossk Vigilance, Luke Command, Quinlan Vos
  assert.deepEqual(idsOf(sortDecks(DECKS, GAMES, SORT_NAME, ORDER_ASC)), ["d3", "d1", "d4", "d2"]);
  assert.deepEqual(idsOf(sortDecks(DECKS, GAMES, SORT_NAME, ORDER_DESC)), ["d2", "d4", "d1", "d3"]);
});

test("sortDecks by games: desc puts most-played first, asc least-played first", () => {
  // counts: d3=2, d1=1, d2=0, d4=0. Ties (the two 0-game decks) always break by
  // name ascending → Luke (d4) before Quinlan (d2) in BOTH directions.
  assert.deepEqual(idsOf(sortDecks(DECKS, GAMES, SORT_GAMES, ORDER_DESC)), ["d3", "d1", "d4", "d2"]);
  assert.deepEqual(idsOf(sortDecks(DECKS, GAMES, SORT_GAMES, ORDER_ASC)), ["d4", "d2", "d1", "d3"]);
});

test("sortDecks games ties break by name ascending regardless of order", () => {
  // d2 (Quinlan) and d4 (Luke) both have 0 games → Luke before Quinlan in BOTH directions among the tie
  const desc = idsOf(sortDecks(DECKS, GAMES, SORT_GAMES, ORDER_DESC));
  assert.ok(desc.indexOf("d4") < desc.indexOf("d2"));
});

test("sortDecks returns a new array, does not mutate input", () => {
  const snapshot = idsOf(DECKS);
  sortDecks(DECKS, GAMES, SORT_NAME, ORDER_DESC);
  assert.deepEqual(idsOf(DECKS), snapshot);
});

// ---------------------------------------------------------------------------
// filterDecks (filter THEN sort)
// ---------------------------------------------------------------------------

test("filterDecks with no active filter returns ALL decks, name-ascending", () => {
  assert.deepEqual(idsOf(filterDecks(DECKS, GAMES, EMPTY_FILTERS)), ["d3", "d1", "d4", "d2"]);
});

test("filterDecks applies the filter then the chosen sort", () => {
  // Villainy decks (d1,d2,d3) sorted by games desc → d3(2), d1(1), d2(0)
  assert.deepEqual(
    idsOf(filterDecks(DECKS, GAMES, {...EMPTY_FILTERS, aspects: ["Villainy"], sortBy: SORT_GAMES, sortOrder: ORDER_DESC})),
    ["d3", "d1", "d2"]
  );
});

test("filterDecks does not mutate inputs", () => {
  const decksSnapshot = JSON.parse(JSON.stringify(DECKS));
  const filters = {...EMPTY_FILTERS, aspects: ["Villainy"]};
  const filtersSnapshot = JSON.parse(JSON.stringify(filters));
  filterDecks(DECKS, GAMES, filters);
  assert.deepEqual(DECKS, decksSnapshot);
  assert.deepEqual(filters, filtersSnapshot);
});

test("filterDecks on a non-array returns []", () => {
  assert.deepEqual(filterDecks(null, GAMES, EMPTY_FILTERS), []);
});
