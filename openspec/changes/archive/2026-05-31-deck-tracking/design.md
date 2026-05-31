## Context

The app had no persistent game state. This change adds the first: a shared pool of decks plus a game log that drives playtesting stats. It mirrors the existing patterns — a context provider (`DecksProvider`) alongside `SettingsProvider`, AsyncStorage persistence with sanitize-on-read tolerance, and a `screen` state machine in `App.jsx`. Pure stat logic lives in React-free modules so the Node test runner can exercise it.

This document describes the FINAL design. Three earlier iterations converged here; the most consequential reversal (a two-collection player/opponent model → a single shared list) is captured in Decision 1.

## Goals / Non-Goals

**Goals:** one shared deck pool usable on either side of a game; symmetric stat-tracking; Random-opponent games that still count for the player; per-opponent matchup notes (archetype + comments) grouped by event; full game-log CRUD + bulk backfill; inline deck selection on Home; a polished card UI; lossless versioned storage migration; pure, unit-tested stat derivation.

**Non-Goals:** cloud sync / accounts / multi-device merge; charts, calendars, leaderboards; automatic outcome detection from life totals; per-game backdating (records default to now); changing the core life-counter game.

## Decisions

### Decision 1: A single shared deck list (not player/opponent collections)
One array of deck records `{id, name, aspects, leader, archetype, notes, createdAt}`. Both loadout sides and both Home dropdowns reference it; a deck may appear on both sides (a mirror counts twice). An intermediate design split decks into "My Decks" / "Opponent Decks"; it was rejected because the user's workflow treats decks as one pool and wants symmetric records (beating a deck is also that deck losing). The shared list is simpler and supports mirror testing trivially.

### Decision 2: Symmetric stats, computed on demand (pure JS)
`context/deckStats.js` derives everything from the game log fresh each call (no caching — counts stay small; pure functions are testable). A game `{playerDeckId, opponentDeckId, outcome}` (outcome ∈ `player_win | opponent_win | draw`) is read from each deck's own perspective: as the player side `player_win`=Win; as the opponent side the mirror. An internal `resultsForDeck` yields 0/1/2 per-side results so a mirror (deck on both sides) contributes twice and `statsForDeck` / `streakForDeck` / `matchupsForDeck` all stay symmetric uniformly. `winPct` rounds to one decimal, `null` when no games.

### Decision 3: Random opponent counts; surfaces as a "Random" matchup row
`__random__` is a sentinel selectable on EITHER side; it is a real, tracked opponent for whichever side is a real deck (overall + streak include it) but accrues no record of its own (never a real `deckId`). `matchupsForDeck` buckets random-opponent games under one synthetic row `{opponentDeckId:"__random__", opponentName:"Random"}`, so matchup rows always sum to the overall total. A game with Random on both sides is not recordable.

### Decision 4: Matchup notes are stored + directional; stats are symmetric
A `Matchup` record `{id, playerDeckId, opponentDeckId, archetype, comments, createdAt, updatedAt}` is keyed by the ordered pair and stores the user's per-opponent archetype tag + strategy comments. It is auto-created on first game for the pair (and creatable/editable from the deck detail). Notes are directional — on A's detail the row for B edits `(A,B)`; on B's detail, `(B,A)` — matching the spreadsheet (each deck has its own notes per opponent). The stats shown in a matchup row are symmetric (from games); only the notes are directional. The Random row has no editable notes.

### Decision 5: Versioned storage + lossless migration (v1 → v2 → v3)
`STORAGE_VERSION = 3`. Keys: `decks`, `matchups`, `games`, `settings`, `storageVersion`. `context/migrations.js` (pure) upgrades any earlier shape: v1 (single `decks`, `player1_win`/`player2_win` enum) and v2 (split `playerDecks`/`opponentDecks`) both resolve to the v3 single `decks` list + the `player_win`/`opponent_win` enum + `defaultDeckId`. Migration is **idempotent** (re-running over v3 data is a no-op — record mappers accept both old and new shapes) and **defensive** (a malformed slot falls back to empty; the provider wraps the flow in try/catch, stamps the version only after all writes succeed, deletes legacy keys last, and on failure preserves `-backup` copies for recovery).

### Decision 6: Provider write-through; reliable mutator returns
`DecksProvider` holds `{decks, matchups, games}`, hydrates on mount (running migration when `version < 3`), and writes through to AsyncStorage on every mutation (fire-and-forget, warn on failure). Mutators that return a value (`addDeck`, `upsertMatchup`, `updateGame`, `bulkAddGames`) compute it from the current closure state rather than inside a `setState` updater, so the return is reliable for synchronous callers. `deleteDeck` cascades (removes matchups + games referencing the id on either side) and heals `settings.defaultDeckId` + the loadout via `updateSettings` called outside the updater (avoids a cross-provider-update warning).

### Decision 7: Loadout in settings; inline Home dropdowns
`settings.activeLoadout = {player1DeckId, player2DeckId}` — EITHER side may be a deck id, `null`, or `__random__` — plus `settings.defaultDeckId` (player default) and `settings.defaultOpponentDeckId` (opponent default). Home renders two inline `Dropdown`s (Player / Opponent) over the shared list (+ Random on both); selecting persists the loadout. `App.jsx` runs a cross-validation effect after hydration: a loadout side whose id no longer resolves heals to its default (`defaultDeckId` / `defaultOpponentDeckId`) or, failing that, to `null` (player) / `__random__` (opponent); `null` and `__random__` sides are left as-is. The loadout is the in-game starting point but is held in component state during a game so either side's deck can be changed mid-game (Issue: mid-game deck change); the persisted loadout is untouched by an in-game change. Recording is gated on at least one side being a real deck.

### Decision 8: In-game deck badge + end-game outcome flow
Each `PlayerView` shows a bottom-left pill badge (deck name + aspect dots; "Random" italic for the random opponent); the opponent half's 180° rotation cascades so each player reads their own badge upright. The `Divider` carries the reset button plus an **end-game** checkmark (`icons/EndGameIcon.jsx`); ending a tracked game opens an outcome modal (`<player deck> won` / `<opponent> won` / Draw / Don't save) whose choice calls `recordGame`. "Return to Home" on a tracked game routes through the same modal; "Don't save" cancels (end-game path) or goes home (return-home path).

### Decision 9: Visual system — polished cards + aspect accents
Shared primitives: `DeckCard` (rounded `#15151a` surface, 4px left accent in the deck's first-aspect color, aspect dots, archetype tag, emphasized win%, green win-rate bar over `#2a2a2e`, ★ for default) and `Dropdown` (labeled pill + ▾ opening a modal scroll list). Win% is the prominent number; section titles use the small-caps style; motion is gated on `settings.enableAnimations` with `useNativeDriver: Platform.OS !== "web"`.

## Risks / Trade-offs
- **Symmetric stats double-count mirror games** — intended ("counts twice").
- **Migration merges old collections** — a v2 user whose opponent deck shared a name with a player deck ends up with two same-named decks (distinct ids); acceptable, the user can delete dupes. Name uniqueness is enforced going forward, not retroactively (never drop data).
- **Random row has no notes** — minor; Random is a catch-all bucket.
- **Storage growth** — ~bytes per game; thousands of games ≈ tens of KB. Non-issue.

## Migration Plan
Additive + versioned. First launch after upgrade: the provider reads `storageVersion`; if `< 3` it runs the chained migration, writes the v3 keys, stamps version 3, and deletes legacy keys. No user action. Rollback: revert commits; orphaned v3 keys are inert to older code (which falls back to defaults).

## Open Questions
- Should the Random matchup row open a games list filtered to random-opponent games? Implemented as yes (reuses GamesScreen with a `__random__` filter).
- Per-game backdating (custom `playedAt`) is deferred — no date-picker dependency is bundled; bulk-add preserves intra-batch ordering via sequential timestamps.
