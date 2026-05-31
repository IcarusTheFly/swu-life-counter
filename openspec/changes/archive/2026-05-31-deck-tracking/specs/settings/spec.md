## ADDED Requirements

### Requirement: Default decks and active loadout are persisted
The persisted settings SHALL include:
- **`defaultDeckId`**: the id of the user's default PLAYER deck (a string from the shared deck list) or `null`.
- **`defaultOpponentDeckId`**: the id of the user's default OPPONENT deck or `null`.
- **`activeLoadout`**: `{player1DeckId, player2DeckId}`. EITHER side may be a deck id, `null` (no deck — allowed), or `"__random__"`. Both ids reference the single shared deck list.

The sanitize layer SHALL validate these on read (a default-deck field rejects `"__random__"` → `null`; a non-string non-null loadout side falls back to that side's default — player1 → `null`, player2 → `"__random__"`), tolerate malformed values, and accept legacy keys once during the migration window (`defaultPlayerDeckId` → `defaultDeckId`), writing only the current keys thereafter.

#### Scenario: First-launch defaults
- **GIVEN** no settings have been saved
- **WHEN** the app launches
- **THEN** `defaultDeckId` and `defaultOpponentDeckId` are `null` and `activeLoadout` is `{player1DeckId: null, player2DeckId: "__random__"}`

#### Scenario: Loadout persists across launches
- **GIVEN** the user selected Player = A, Opponent = B
- **WHEN** the app is closed and reopened
- **THEN** the Home dropdowns show A and B

#### Scenario: Either side may be Random
- **GIVEN** a persisted `activeLoadout` with `player1DeckId: "__random__"` and `player2DeckId: "deck_y"`
- **WHEN** settings hydrate
- **THEN** both values are preserved (the player side is no longer special)

#### Scenario: Setting an opponent default persists it
- **WHEN** the user taps "Set as default for Opponent" on a deck
- **THEN** `defaultOpponentDeckId` is that deck's id and the loadout's opponent side is set to it

#### Scenario: Loadout self-heals against the shared list
- **GIVEN** a loadout side references a deck id no longer present
- **WHEN** the app hydrates
- **THEN** the player side falls back to `defaultDeckId` (or null) and the opponent side falls back to `defaultOpponentDeckId` (or `"__random__"`); `null` and `"__random__"` sides are left as-is

#### Scenario: Legacy default key migrates
- **GIVEN** a persisted blob with `defaultPlayerDeckId` and no `defaultDeckId`
- **WHEN** settings hydrate
- **THEN** the in-memory `defaultDeckId` carries the legacy value and subsequent writes emit only `defaultDeckId`

## MODIFIED Requirements

### Requirement: Initial Life Points default is 0, presets are 0 / 25 / 30 / 35
The default `initialLife` SHALL be **0**. A new installation, or any settings reset, SHALL start with initial life at 0. The user may change it via: (1) the inline editable number — the value between the `−` and `+` buttons is a `TextInput` that commits on blur / Enter, rejects out-of-range integers with a 2-second error message and reverts; (2) the `−` / `+` stepper buttons; (3) the quick-pick preset chips: **0**, **25**, **30**, **35**. The previous default (30) and previous presets (20 / 25 / 30 / 40) are superseded.

#### Scenario: Default life on first launch
- **GIVEN** no `initialLife` in storage
- **WHEN** the app launches
- **THEN** `settings.initialLife` is 0 and a game starts at 0 HP until the user changes it

#### Scenario: Preset chips reflect the new values
- **WHEN** the user opens Settings
- **THEN** the quick-pick chips show 0, 25, 30, 35 (not 20 / 30 / 40)

#### Scenario: Inline edit validates and reverts
- **WHEN** the user types 999 into the life input and blurs
- **THEN** an error "0–99 only" flashes for 2 seconds, the input reverts to the last valid value, and `initialLife` is unchanged

### Requirement: Team color selection uses labeled dropdowns
The Settings screen SHALL present the Player and Opponent team-color selectors as two side-by-side **dropdown pills** (each showing a color dot + color name + ▾, opening the shared deck-picker sheet on tap). This replaces the previous row of individual swatch circles. Both dropdowns draw from the same 8-color palette; selecting a color persists it to `player1Color` / `player2Color` immediately.

#### Scenario: Color dropdown shows current selection
- **WHEN** the user opens Settings with Player color = Green
- **THEN** the Player dropdown pill shows a green dot and the label "Green"
- **WHEN** the user taps it and selects Blue
- **THEN** the pill updates to show a blue dot and "Blue", and `player1Color` is persisted
