// Pure deck-list filtering + sorting for the Decks screen's collapsible
// "Filters" panel.
//
// React-free and dependency-free so the Node test runner (`npm test`) can
// exercise it without the Metro bundler. The Decks screen owns the filter UI
// + state and calls these helpers to derive the visible, ordered list.
//
// Shape:
//   {
//     search:     string,             // deck-name substring, case-insensitive
//     aspects:    string[],           // selected aspect names — deck matches ANY
//     archetypes: string[],           // selected archetype tags — deck matches ANY (ci)
//     sortBy:     "name" | "games",   // ordering key
//     sortOrder:  "asc" | "desc"      // ordering direction
//   }
// Filter dimensions (search / aspects / archetypes) are ANDed together; within
// `aspects`/`archetypes` the match is OR. Sort/order are NOT filters — they
// always have a value (default name/asc) and never count as "active".

export const SORT_NAME = "name";
export const SORT_GAMES = "games";
export const ORDER_ASC = "asc";
export const ORDER_DESC = "desc";

export const EMPTY_FILTERS = {
  search: "",
  aspects: [],
  archetypes: [],
  sortBy: SORT_NAME,
  sortOrder: ORDER_ASC
};

// Whether any NARROWING filter dimension is active (search / aspects /
// archetypes). Sort/order are excluded — they always have a value.
export function hasActiveFilters(filters) {
  return activeFilterCount(filters) > 0;
}

export function activeFilterCount(filters) {
  if (!filters || typeof filters !== "object") return 0;
  let n = 0;
  if (typeof filters.search === "string" && filters.search.trim().length > 0) n += 1;
  if (Array.isArray(filters.aspects) && filters.aspects.length > 0) n += 1;
  if (Array.isArray(filters.archetypes) && filters.archetypes.length > 0) n += 1;
  return n;
}

// Distinct, sorted, non-empty archetype tags across the decks — feeds the
// archetype filter chips. Case-insensitive de-dupe, preserving first-seen
// casing for display.
export function distinctArchetypes(decks) {
  if (!Array.isArray(decks)) return [];
  const seen = new Map(); // lowercased key → original-cased value
  for (const d of decks) {
    const a = d && typeof d.archetype === "string" ? d.archetype.trim() : "";
    if (a.length === 0) continue;
    const key = a.toLowerCase();
    if (!seen.has(key)) seen.set(key, a);
  }
  return [...seen.values()].sort((x, y) => x.localeCompare(y));
}

// Number of recorded game-sides involving the deck — matches the card's W-L-D
// total (a mirror, where the deck is on both sides, counts twice; a Random
// opponent contributes one side). Used by the "games played" sort.
export function gamesCountForDeck(deckId, games) {
  if (!Array.isArray(games)) return 0;
  let n = 0;
  for (const g of games) {
    if (!g) continue;
    if (g.playerDeckId === deckId) n += 1;
    if (g.opponentDeckId === deckId) n += 1;
  }
  return n;
}

// Does one deck pass every ACTIVE filter dimension?
export function deckMatchesFilters(deck, filters) {
  if (!deck) return false;
  if (!filters || typeof filters !== "object") return true;

  // Search — name substring, case-insensitive.
  const search = typeof filters.search === "string" ? filters.search.trim().toLowerCase() : "";
  if (search.length > 0) {
    const name = typeof deck.name === "string" ? deck.name.toLowerCase() : "";
    if (!name.includes(search)) return false;
  }

  // Aspects — deck must contain at least ONE selected aspect.
  if (Array.isArray(filters.aspects) && filters.aspects.length > 0) {
    const deckAspects = Array.isArray(deck.aspects) ? deck.aspects : [];
    if (!filters.aspects.some((a) => deckAspects.includes(a))) return false;
  }

  // Archetypes — deck's archetype must be ONE of the selected (case-insensitive).
  // Empty selected values are ignored; a deck with no archetype never matches.
  if (Array.isArray(filters.archetypes) && filters.archetypes.length > 0) {
    const selected = filters.archetypes
      .map((a) => String(a).trim().toLowerCase())
      .filter((a) => a.length > 0);
    if (selected.length > 0) {
      const arch = typeof deck.archetype === "string" ? deck.archetype.trim().toLowerCase() : "";
      if (arch.length === 0 || !selected.includes(arch)) return false;
    }
  }

  return true;
}

// Sort a deck list by the chosen key + direction. Returns a NEW array. "name"
// sorts case-insensitively; "games" sorts by recorded game count with a stable
// name-ascending tie-break. (Names are unique, so name sort needs no tie-break.)
export function sortDecks(decks, games, sortBy = SORT_NAME, sortOrder = ORDER_ASC) {
  if (!Array.isArray(decks)) return [];
  const dir = sortOrder === ORDER_DESC ? -1 : 1;
  const byName = (a, b) =>
    String(a.name || "").toLowerCase().localeCompare(String(b.name || "").toLowerCase());
  const sorted = decks.slice();
  if (sortBy === SORT_GAMES) {
    sorted.sort((a, b) => {
      const diff = gamesCountForDeck(a.id, games) - gamesCountForDeck(b.id, games);
      if (diff !== 0) return dir * diff;
      return byName(a, b); // deterministic tie-break, always ascending
    });
  } else {
    sorted.sort((a, b) => dir * byName(a, b));
  }
  return sorted;
}

// Filter THEN sort a deck list. Returns a NEW array; never mutates the inputs.
export function filterDecks(decks, games, filters) {
  if (!Array.isArray(decks)) return [];
  const narrowed = hasActiveFilters(filters)
    ? decks.filter((d) => deckMatchesFilters(d, filters))
    : decks.slice();
  const sortBy = filters && filters.sortBy ? filters.sortBy : SORT_NAME;
  const sortOrder = filters && filters.sortOrder ? filters.sortOrder : ORDER_ASC;
  return sortDecks(narrowed, games, sortBy, sortOrder);
}
