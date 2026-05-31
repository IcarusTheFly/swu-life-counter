// Pure-JS constants for the deck-tracking feature.
//
// Kept React-free so `context/sanitize.js`, `context/deckStats.js`,
// `context/migrations.js`, and the Node-based test runner can import these
// without dragging in the Metro bundler.
//
// The six SWU aspects are defined here once, with their canonical brand
// colors. UI consumers (deck rows, in-game badge dots, the aspect picker)
// should read the colors from this file rather than hard-coding the hex
// values inline.

// Canonical SWU aspect names mapped to their brand-identity hex colors.
// Order matters: this is the order the aspect picker renders chips in, and
// also the order matchups will list aspect dots when sorting alphabetically
// is not desired. See design.md Decision 7.
export const ASPECTS = {
  Vigilance: {color: "#3b82f6"}, // blue
  Command: {color: "#10b981"}, // green
  Aggression: {color: "#ef4444"}, // red
  Cunning: {color: "#facc15"}, // yellow
  Heroism: {color: "#f5f5f4"}, // white
  Villainy: {color: "#27272a"} // black
};

// Sentinel id meaning "the opponent side is untracked" — see design.md
// Decision 2. Only valid on the OPPONENT side of a loadout. Reserved: no
// generated deck id may equal this string (enforced by the id generators).
export const RANDOM_DECK_ID = "__random__";

// Field-length and selection caps for deck records and the deck edit form
// (see specs/decks).
export const MAX_ASPECTS_PER_DECK = 3;
export const DECK_NAME_MAX = 50;
export const DECK_LEADER_MAX = 80;
export const DECK_NOTES_MAX = 500;
// Archetype tag length cap — applies to BOTH the per-deck archetype field
// (player + opponent deck records) and the per-matchup archetype tag.
export const DECK_ARCHETYPE_MAX = 40;
export const MATCHUP_ARCHETYPE_MAX = 40;
// Matchup strategic notes — longer than per-deck notes because they're the
// primary place strategic commentary lives in v2.
export const MATCHUP_COMMENTS_MAX = 1000;
// Per-game free-text comment (e.g. "tested triple-removal opening").
export const GAME_COMMENT_MAX = 500;
// Event tag on a game record (e.g. "PETRANAKI", "LOCALS", "FNM 2026-05-29").
export const EVENT_TAG_MAX = 40;

// Storage version history:
//   v1 — the original `add-deck-tracking` shape (single `decks` list).
//   v2 — the `enhance-deck-tracking` two-collection split
//        (`playerDecks` + `opponentDecks`) + matchups + renamed game enum.
//   v3 — `refine-deck-tracking` collapses the split back into ONE shared
//        `decks` list with symmetric stats (this change).
// The DecksProvider reads the persisted version on hydrate and runs the
// migration helper when the value is missing OR `< STORAGE_VERSION`.
export const STORAGE_VERSION = 3;
export const STORAGE_VERSION_KEY = "@swu-life-counter:storageVersion";

// AsyncStorage keys.
//
// `DECKS_STORAGE_KEY` is the SINGLE source of truth for the deck list in v3
// (it was also the v1 key — v3 restores the single-list shape, so the same
// key carries it again).
export const DECKS_STORAGE_KEY = "@swu-life-counter:decks";
// LEGACY-READ-ONLY. The v2 two-collection keys. In v3 these are never
// written; `context/migrations.js` reads them once during the v2 → v3
// upgrade (merging both into the single `decks` list) and the DecksProvider
// deletes them afterwards. Do NOT use these for new persistence.
export const PLAYER_DECKS_STORAGE_KEY = "@swu-life-counter:playerDecks";
export const OPPONENT_DECKS_STORAGE_KEY = "@swu-life-counter:opponentDecks";
export const MATCHUPS_STORAGE_KEY = "@swu-life-counter:matchups";
export const GAMES_STORAGE_KEY = "@swu-life-counter:games";

// Id prefixes.
//
// v3 uses a SINGLE deck prefix (`deck_`) — there's one shared list, so the
// prefix no longer needs to carry a collection. New decks created in v3 get
// `deck_*` ids.
export const DECK_ID_PREFIX = "deck_";
// LEGACY-READ-ONLY. The v2 per-collection prefixes. Pre-existing `pdeck_*` /
// `odeck_*` ids survive the v2 → v3 migration verbatim (an id is opaque and
// stable across versions); these are kept exported only so the migration +
// any version-agnostic lookup can recognize them. New decks never use them.
export const PLAYER_DECK_ID_PREFIX = "pdeck_";
export const OPPONENT_DECK_ID_PREFIX = "odeck_";
export const MATCHUP_ID_PREFIX = "match_";
export const GAME_ID_PREFIX = "game_";
