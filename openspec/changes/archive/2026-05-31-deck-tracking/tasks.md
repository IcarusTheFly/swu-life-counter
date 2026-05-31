# Tasks

This change is **implemented and verified** (web smoke + Node test suite, 127 tests passing). Tasks below reflect the as-built feature; only archival remains.

## 1. Constants + storage

- [x] 1.1 `constants/decks.js`: `ASPECTS` (6 aspects → canonical colors), `RANDOM_DECK_ID`, `MAX_ASPECTS_PER_DECK`, field caps (`DECK_NAME_MAX = 50`, `DECK_LEADER_MAX`, `DECK_ARCHETYPE_MAX`, `DECK_NOTES_MAX`, `MATCHUP_*`, `GAME_*`, `EVENT_TAG_MAX`), `STORAGE_VERSION = 3`, storage keys, id prefixes.
- [x] 1.2 `constants/settings.js`: add `defaultDeckId: null`, `defaultOpponentDeckId: null`, `activeLoadout: {player1DeckId: null, player2DeckId: "__random__"}` to `DEFAULT_SETTINGS`; set `initialLife` default to **0**; update `INITIAL_LIFE_PRESETS` to `[0, 25, 30, 35]`.

## 2. Persistence + migration

- [x] 2.1 `context/migrations.js` (pure JS): upgrade v1 (single list, legacy enum) and v2 (split player/opponent collections) → v3 single shared `decks` list + `player_win`/`opponent_win` enum + `defaultDeckId`. Idempotent + defensive (per-slot fallback, never throws).
- [x] 2.2 `context/sanitize.js`: validate `defaultDeckId` (string|null, reject `"__random__"`) and `activeLoadout`; read legacy keys once during migration window; emit only current keys.

## 3. Decks context + stats

- [x] 3.1 `context/DecksContext.jsx`: `DecksProvider` holding `{decks, matchups, games}`; hydrate (running migration when version < 3); write-through on mutation; gate render until hydrated.
- [x] 3.2 Mutators: `addDeck`/`updateDeck`/`deleteDeck` (cascade both sides + heal default/loadout), `upsertMatchup`/`ensureMatchup`/`getMatchup`/`getMatchupsForDeck`, `recordGame`/`updateGame`/`deleteGame`/`bulkAddGames`; selectors `getDeckById`/`getGamesByPair`. Return values computed from closure state (reliable for callers).
- [x] 3.3 `context/deckStats.js` (pure JS): `statsForDeck`, `matchupsForDeck` (symmetric; Random bucket), `streakForDeck`, `eventsInGames`, `groupMatchupsByEvent`, `gamesGroupedByOpponent` (per-deck game LOG grouped by opponent for the Game History view).

## 4. App integration

- [x] 4.1 `App.jsx`: `DecksProvider` inside `SettingsProvider`; screen routes for decks / deck-detail / deck-edit / bulk-add-games / game-history; loadout cross-validation against the shared list (player → `defaultDeckId`/null, opponent → `__random__`/default-opponent).

## 5. Deck-management screens + visual system

- [x] 5.1 `components/DeckCard.jsx` + `components/Dropdown.jsx`: shared visual primitives (aspect accent, win%, win-rate bar; labeled dropdown over a modal list).
- [x] 5.2 `components/DecksScreen.jsx`: single list of stat cards (alphabetical by default, no ★), collapsible Filters panel (search / aspects / archetypes + Sort: Name|Games, Order: Asc|Desc), "+ New Deck", empty state.
- [x] 5.3 `components/DeckEditScreen.jsx`: create/edit (name ≤ 50 + aspects ≤ 3 + leader + archetype + notes; uniqueness; first deck → default + loadout).
- [x] 5.4 `components/DeckDetailScreen.jsx`: overall stats card, streak, matchups grouped by event (incl. Random row), inline-editable archetype + comments per named matchup; actions include **two default checkboxes** (silver Player / gold Opponent) that toggle on/off — checking sets the deck + loadout side, unchecking clears the default and resets that slot to Random.
- [x] 5.5 `components/SettingsScreen.jsx`: replace color swatch circles with two side-by-side **Dropdown** pills; remove the separate "TYPE A VALUE" text input — the big number between `−` and `+` is now an inline `TextInput` (commits on blur/Enter, validates, flashes error on bad input, reverts).

## 6. Game-log screens

- [x] 6.1 `components/GameHistoryScreen.jsx`: per-deck game LOG grouped by opponent ("record vs deck X") — per-opponent W-L-D + win% + bar, individual games (result chip / event / date / comment) newest-first. Supports: **+ ADD inline form** (one at a time; this deck as player side; opponent picker + W/L/D chips + event + comment; "Add Game" disabled until opponent chosen); **✎ edit mode** on each row (W/L/D chips + event + comment editable in-place; `isPlayerSide` from `gamesGroupedByOpponent` ensures correct outcome conversion); **✕ delete** with confirmation. Empty state shows even when no games exist (add form still accessible). (Replaces the deleted bare `GamesScreen`/`GameEditScreen` — issue #5.)
- [x] 6.2 ~~`components/GameEditScreen.jsx`~~ — removed: per-row inline editing in Game History replaces it.
- [x] 6.3 `components/BulkAddGamesScreen.jsx`: player + opponent (+ Random) + W/L/D + event + comment; inline new-deck create.

## 7. Home + in-game

- [x] 7.1 `components/HomeScreen.jsx`: inline Player/Opponent dropdowns + Decks button; empty-state routing.
- [x] 7.2 `components/LifeCounter.jsx`: snapshot loadout; outcome modal; `recordGame` (v3 enum); dual "Don't save" semantics.
- [x] 7.3 `components/PlayerView.jsx`: bottom-left deck badge (pill, aspect dots, Random italic).
- [x] 7.4 `components/Divider.jsx` + `icons/EndGameIcon.jsx`: end-game control next to reset.
- [x] 7.5 `components/ConfirmationModal.jsx`: entry animation + `message` prop.

## 8. Tests + docs

- [x] 8.1 `__tests__/deckStats.test.js`: symmetric stats, Random counts + Random matchup row, mirror counts twice, event grouping, and `gamesGroupedByOpponent` (log grouping, perspective inversion, mirror-once, Random group, reconciliation, delete-safe).
- [x] 8.2 `__tests__/migrations.test.js`: v1→v3, v2→v3 merge, idempotency, corrupted-slot fallback.
- [x] 8.3 `__tests__/sanitize.test.js`: `defaultDeckId` + `activeLoadout` validation + legacy reads.
- [x] 8.4 `README.md`: Decks-and-stats section (shared list, symmetric stats, Random counts, inline dropdowns, bulk add).
- [x] 8.5 `npm test` green (160 passing).

## 9. Verification

- [x] 9.1 Web smoke: v2→v3 migration merges decks; symmetric stats reconcile; Random game counts + Random row; Home dropdowns drive the loadout; in-game badge + end-game record correctly; new card visuals render; name accepts 50 chars; default checkboxes toggle + uncheck → Random; Game History add-game form records correctly (opponent_win from L); edit row patches outcome + persists; delete removes record and updates group totals; Settings color dropdowns persist + update pill; life stepper input 120 px, validates range, preset chips + step buttons work.
- [ ] 9.2 Native device pass (iOS/Android) — haptics + real-device gestures. Pending.

## 10. Archival

- [ ] 10.1 Archive `deck-tracking` — promote `decks` + the `home-screen`/`settings` deltas to the live specs.
