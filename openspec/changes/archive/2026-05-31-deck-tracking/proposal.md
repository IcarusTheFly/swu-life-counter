## Why

The app is a stateless life counter — once a game ends, nothing is remembered. Players who *test* decks (the most engaged segment) track win-rates and matchups on paper or in spreadsheets. This change moves that bookkeeping into the app: a shared pool of named **decks**, a persisted **game log**, derived per-deck **stats** (W-L-D, win%, streak), per-opponent **matchups** with strategy notes, and tools to **record / edit / bulk-add** games — all local, no accounts, no cloud.

> **Consolidation note.** This change supersedes and merges three earlier iterations (`add-deck-tracking`, `enhance-deck-tracking`, `refine-deck-tracking`) into one authoritative spec. It documents the feature in its final, implemented form: a single shared deck list with symmetric stats. The intermediate two-collection (player/opponent) model from `enhance-deck-tracking` was explored and rejected — see design Decision 1.

## What Changes

**New Decks capability:**
- A **Decks** screen lists every saved deck as a card (aspect-colored accent, win%, streak, win-rate bar), ordered alphabetically by default. A collapsible **Filters** panel (hidden by default) narrows the list by name, aspect, and archetype, and sets the sort (Name / Games played) + order (Asc / Desc).
- **Deck CRUD** in a single shared list. Each deck: `name` (required, unique case-insensitive, ≤ 50 chars), `aspects` (0–3 of the six SWU aspects), `leader` (optional), `archetype` (optional tag, e.g. "Colossus"), `notes` (optional). The same deck may be used on both sides of a game (a mirror — it counts twice).
- **Deck detail** screen: overall W-L-D + win% + streak; head-to-head **matchups grouped by event** (e.g. PETRANAKI / LOCALS), each row with its own archetype tag + inline-editable strategy comments; actions — two **default checkboxes** (silver Player / gold Opponent, each toggling on/off — unchecking resets that loadout side to Random) / **Game History** / Bulk Add / Edit / Delete (cascades).
- **Symmetric stats:** one recorded game updates BOTH decks (A beats B ⇒ A +win vs B, B +loss vs A). Stats count games where a deck is on either side.
- **Game recording + bulk add:** games are recorded in-game (the end-game outcome prompt) and via a **Bulk Add** flow (pick a matchup, type W/L/D + an event tag) to backfill seasons of playtesting.
- **Game History (per deck):** a **Game History** view lists every game involving the deck, **grouped by opponent** (the record + each individual game "against deck X"), result chips from the deck's perspective, newest-first. Supports **adding** a new game inline (one form at a time; this deck is always the player side), **editing** any game row in-place (outcome / event / comment), and **deleting** individual records with confirmation. There is no global per-game list/editor screen.
- **Event tags** (free-text per game, e.g. "PETRANAKI"), used to group the matchups view and offered as autocomplete suggestions.

**Game-start + in-game integration:**
- Home shows two inline **dropdowns** — Player and Opponent — both drawing from the shared deck list, and each also offering **Random**. Selecting persists the loadout; Start Game plays it.
- A game vs **Random** still counts toward the player deck's record and appears under a "Random" row in its matchups.
- In-game, each side shows its deck name + aspect dots in a bottom-left bubble. An **end-game** checkmark sits next to the reset icon; ending a game prompts for the outcome (`<player deck> won` / `<opponent> won` / Draw / Don't save) and records it.

**Visual:** the deck-tracking screens use a polished card system — rounded surfaces, aspect-colored accents, emphasized win%, green win-rate bars — consistent with the app's dark/space aesthetic and FiraCode typography.

**Persistence + migration:** decks, matchups, and games persist in AsyncStorage (storage version 3). A versioned migration upgrades any earlier storage shape (v1 single list, v2 two-collection) into the v3 single shared list without data loss; failures fall back to safe defaults and preserve a recoverable backup.

**Settings screen improvements (bundled):** the Team Colors row is replaced by two side-by-side **dropdown pills** (colored dot + name, opens the shared picker sheet). The life-points "TYPE A VALUE" text input is removed — the big number between `−` and `+` is now directly editable inline. The **default Initial Life is 0**; the quick-pick presets are **0 / 25 / 30 / 35** (replaces the previous 20 / 25 / 30 / 40).

## Capabilities

### New Capabilities
- `decks`: shared deck list + CRUD; deck list / detail / edit screens; persisted game log; symmetric stat derivation (overall, win%, streak, per-opponent matchups incl. a Random row); matchup records (archetype + comments); game CRUD + bulk add; event tags; the in-game deck badge + end-game outcome flow.

### Modified Capabilities
- `home-screen`: adds the two inline deck dropdowns (Player / Opponent) + the Decks menu button.
- `settings`: adds `defaultDeckId` and `activeLoadout` to the persisted shape; changes `initialLife` default to 0 and presets to [0,25,30,35]; replaces color swatches with labeled dropdowns; removes the separate life text-input section (value field is now inline-editable).

## Impact

**New code:** `constants/decks.js`; `context/DecksContext.jsx`; `context/deckStats.js`; `context/deckFilters.js`; `context/migrations.js`; `components/DecksScreen.jsx`, `DeckDetailScreen.jsx`, `DeckEditScreen.jsx`, `BulkAddGamesScreen.jsx`, `GameHistoryScreen.jsx`, `DeckCard.jsx`, `Dropdown.jsx`; `icons/EndGameIcon.jsx`.

**Modified code:** `constants/settings.js` (`defaultDeckId`, `activeLoadout`; `initialLife` default → 0; `INITIAL_LIFE_PRESETS` → [0,25,30,35]); `context/sanitize.js` (validate the new settings fields, legacy-key reads); `context/deckStats.js` (`gamesGroupedByOpponent` — per-deck game log grouped by opponent, incl. `isPlayerSide` field for perspective-correct editing); `App.jsx` (deck routes incl. `game-history` + loadout cross-validation); `components/HomeScreen.jsx` (inline dropdowns + Decks button); `components/LifeCounter.jsx` (snapshot loadout, outcome modal, recordGame); `components/DeckDetailScreen.jsx` (default checkboxes toggle on/off, uncheck resets to Random; Game History action); `components/GameHistoryScreen.jsx` (add-game inline form + per-row edit mode); `components/SettingsScreen.jsx` (color dropdowns, inline editable life stepper); `components/PlayerView.jsx` (deck badge); `components/Divider.jsx` (end-game button); `components/ConfirmationModal.jsx` (entry animation + message).

**Tests:** `__tests__/deckStats.test.js`, `__tests__/migrations.test.js`, `__tests__/sanitize.test.js`, `__tests__/deckFilters.test.js` (Node test runner; symmetric stats, Random-counts, v1/v2 → v3 migration, settings validation, deck-list filtering).

**Dependencies:** none new (AsyncStorage already present).

**Specs:** new `specs/decks/spec.md`; deltas `specs/home-screen/spec.md` + `specs/settings/spec.md`.
