# settings Specification

## Purpose

The `settings` capability defines user-configurable preferences for the life counter — team colors per side and initial life points — along with optional UX preferences (animations, haptic feedback on mobile). It also covers how those preferences are surfaced in the Settings screen, applied to the in-game life counter, clamped, and persisted across app launches.

## Requirements

### Requirement: Settings screen exposes Team Colors and Initial Life controls
The Settings screen SHALL contain two clearly labeled sections: **Team Colors** and **Initial Life Points**, plus optional UX-preference sections (see ADDED Requirements below). A back affordance (chevron in the top-left) SHALL return the user to Home.

#### Scenario: Settings screen layout
- **WHEN** the Settings screen is rendered
- **THEN** a back chevron is visible in the top-left
- **AND** a "Settings" title is visible
- **AND** a "Team Colors" section is rendered
- **AND** an "Initial Life Points" section is rendered
- **AND** no "Life Mode" section is rendered (the Count Up / Count Down selector has been removed)

#### Scenario: Back chevron returns to Home
- **WHEN** the user taps the back chevron on the Settings screen
- **THEN** the Home screen is shown
- **AND** any changes the user made are preserved (already persisted at the moment of change)

### Requirement: Team color selection uses labeled dropdowns
The Settings screen SHALL present the Player and Opponent team-color selectors as two side-by-side **dropdown pills** (each showing a color dot + color name + ▾, opening the shared deck-picker sheet on tap). This replaces the previous row of individual swatch circles. Both dropdowns draw from the same 8-color palette; selecting a color persists it to `player1Color` / `player2Color` immediately.

#### Scenario: Color dropdown shows current selection
- **WHEN** the user opens Settings with Player color = Green
- **THEN** the Player dropdown pill shows a green dot and the label "Green"
- **WHEN** the user taps it and selects Blue
- **THEN** the pill updates to show a blue dot and "Blue", and `player1Color` is persisted

### Requirement: Selected team colors are applied to the in-game life counter
The selected Player and Opponent colors SHALL be applied to the corresponding side of the life counter when the next game starts. The press-feedback tint of the +/− buttons SHALL use the selected color at ~40% alpha.

The visible application of the team color *on the background artwork itself* depends on per-color image assets being available (see the design doc's Open Questions for the asset strategy). When those assets land, the appropriate variant for each side's selected color SHALL be rendered.

#### Scenario: Press-feedback uses the selected color
- **GIVEN** the user has chosen Player = blue, Opponent = orange in Settings
- **WHEN** the user returns to Home and taps "Start Game"
- **AND** the user presses a +/− button on the Player side
- **THEN** the press-feedback tint is blue
- **WHEN** the user presses a +/− button on the Opponent side
- **THEN** the press-feedback tint is orange

#### Scenario: Defaults match prior visual behavior on first launch
- **GIVEN** no settings have been persisted yet (first launch)
- **WHEN** the user starts a game
- **THEN** Player's press-feedback tint is green and Opponent's is red (preserving the pre-change visual)

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

#### Scenario: Increment and decrement initial life
- **GIVEN** Initial Life is 30
- **WHEN** the user taps the "+" button on the stepper
- **THEN** Initial Life becomes 31
- **WHEN** the user taps the "−" button on the stepper
- **THEN** Initial Life becomes 30

#### Scenario: Initial Life is clamped to 0–99 via the stepper
- **GIVEN** Initial Life is 99
- **WHEN** the user taps the "+" button
- **THEN** Initial Life remains 99 (does not exceed 99)
- **GIVEN** Initial Life is 0
- **WHEN** the user taps the "−" button
- **THEN** Initial Life remains 0 (the new lower bound)

#### Scenario: Typed input commits a valid value
- **GIVEN** Initial Life is 30 and the user opens the typed-input field
- **WHEN** the user types `42` and confirms (blur / submit)
- **THEN** Initial Life becomes 42
- **AND** the persisted setting reflects 42

#### Scenario: Typed input rejects out-of-range values
- **GIVEN** Initial Life is 30
- **WHEN** the user types `100` and confirms
- **THEN** Initial Life remains 30
- **AND** an inline "0–99 only" message is shown briefly
- **WHEN** the user types `-5` and confirms
- **THEN** Initial Life remains 30 (negative values are rejected because the in-game minimum [-9] applies during play, not during setup)

#### Scenario: Typed input supports starting at zero directly
- **GIVEN** the user wants to play "count up from 0"
- **WHEN** the user types `0` in the Initial Life Points field and confirms
- **THEN** Initial Life becomes 0
- **AND** the next game starts at 0/0

#### Scenario: Stepper is always visible (no mode-conditional rendering)
- **WHEN** the Settings screen is rendered
- **THEN** the Initial Life stepper and typed-input field are visible
- **AND** there is no mode selector that could hide them

### Requirement: Initial life points applies at game start
The chosen Initial Life value SHALL determine the starting life total for both players on the next game. Changing this setting SHALL NOT affect an already-running game (Settings is only reachable from Home, so this is naturally enforced).

#### Scenario: Game starts at the chosen Initial Life
- **GIVEN** the user has set Initial Life to `40`
- **WHEN** the user starts a game
- **THEN** both players begin with 40 life

#### Scenario: Game starts at zero when Initial Life is zero
- **GIVEN** the user has set Initial Life to `0`
- **WHEN** the user starts a game
- **THEN** both players begin with 0 life
- **AND** tapping "+" increases the value
- **AND** tapping "−" decreases the value down to the in-game floor of -9 (the lower in-game clamp is global, see "Life value is clamped to a fixed range")

#### Scenario: In-game Reset uses the values active at game start
- **GIVEN** the user started a game at Initial Life 40, then reduced their life to 12
- **WHEN** the user taps the reset icon and then "Reset Life"
- **THEN** both players return to 40 (the value at game start)

### Requirement: Life value is clamped to a fixed range
Life values SHALL be clamped to a fixed range of **[-9, 99]** in both directions, regardless of the chosen Initial Life value. The lower bound of -9 preserves the historical "Count Down" floor so cosmic-damage situations remain expressible. The upper bound of 99 preserves the 2-digit display constraint.

#### Scenario: Upper clamp at 99
- **GIVEN** life is 99
- **WHEN** the user taps "+"
- **THEN** life remains 99

#### Scenario: Lower clamp at -9
- **GIVEN** life is -9
- **WHEN** the user taps "−"
- **THEN** life remains -9

#### Scenario: Starting at 0, tapping minus, lower clamp is -9
- **GIVEN** the user started a game with Initial Life = 0
- **WHEN** the user taps "−" nine times
- **THEN** life is -9
- **WHEN** the user taps "−" again
- **THEN** life remains -9 (the floor)

### Requirement: Settings persist across app launches
All settings (player1Color, player2Color, initialLife, enableAnimations, enableHaptics) SHALL be persisted to local storage and restored on subsequent launches.

#### Scenario: Settings survive an app restart
- **GIVEN** the user has set Player = purple, Opponent = yellow, Initial Life = 25, and disabled animations
- **WHEN** the user fully closes and reopens the app
- **THEN** the Settings screen shows the same Player/Opponent colors, Initial Life = 25, and animations disabled
- **AND** starting a game uses those values

#### Scenario: First launch uses defaults
- **GIVEN** no settings have ever been saved
- **WHEN** the app launches
- **THEN** the in-memory settings are player1Color `green`, player2Color `red`, initialLife `30`, enableAnimations `true`, enableHaptics `false`

#### Scenario: Legacy startingLife is migrated to initialLife on read
- **GIVEN** a persisted blob from a prior version has `{startingLife: 40, lifeMode: "down"}` and no `initialLife` key
- **WHEN** the SettingsProvider hydrates on mount
- **THEN** the in-memory `initialLife` value is `40`
- **AND** the next `updateSettings` call writes back a blob with `initialLife: 40` and no `startingLife` or `lifeMode` keys

#### Scenario: Legacy lifeMode "up" migrates to initialLife 0
- **GIVEN** a persisted blob from a prior version has `{lifeMode: "up", startingLife: 30}` (Count Up users had `startingLife` ignored during play)
- **WHEN** the SettingsProvider hydrates on mount
- **THEN** the in-memory `initialLife` value is `0` (preserving the prior up-mode game-start behavior)
- **AND** the next `updateSettings` call writes back a blob with `initialLife: 0`

#### Scenario: Persistence failure does not crash the app
- **GIVEN** a write to storage fails
- **WHEN** the user changes a setting
- **THEN** the new value applies for the current session
- **AND** no error dialog is shown to the user
- **AND** the failure is logged for diagnostics

### Requirement: Animations are toggleable
The Settings screen SHALL contain an **Animations** toggle. When disabled, the in-game life-change overlay animation SHALL be skipped (or set to zero-duration so the overlay still appears as feedback but does not animate in/out), and the initiative-claim shine animation SHALL likewise be non-animated. The default SHALL be **enabled** (animations on).

#### Scenario: Toggling animations off skips the fade
- **GIVEN** Animations are currently enabled (default)
- **WHEN** the user taps the toggle to disable
- **AND** the user starts a game and taps "+" on the life counter
- **THEN** the life-change overlay appears immediately (no fade-in) and disappears after the usual 2s window (no fade-out)
- **AND** the underlying life total still increments by 1

#### Scenario: Toggling animations off skips the initiative shine
- **GIVEN** Animations are currently disabled
- **WHEN** the user claims initiative on a side
- **THEN** the initiative indicator transitions to the active state without the scale/opacity shine animation

#### Scenario: First launch default is enabled
- **GIVEN** no settings have been persisted (first launch)
- **WHEN** the Settings screen is rendered
- **THEN** Animations are in the enabled state

### Requirement: Haptic feedback is toggleable on mobile
On Android and iOS, the Settings screen SHALL contain a **Haptic feedback** toggle. When enabled, tapping `+` or `−` on the life counter SHALL trigger a light haptic tap via the OS haptic engine (`expo-haptics`' `selectionAsync`). The default SHALL be **disabled**. On web, the Haptic feedback section SHALL NOT be rendered.

#### Scenario: Haptic toggle is rendered on mobile
- **GIVEN** the app is running on Android or iOS
- **WHEN** the Settings screen is rendered
- **THEN** a "Haptic feedback" toggle is visible

#### Scenario: Haptic toggle is hidden on web
- **GIVEN** the app is running in a browser (`Platform.OS === "web"`)
- **WHEN** the Settings screen is rendered
- **THEN** no "Haptic feedback" toggle is rendered
- **AND** the persisted `enableHaptics` value (if any) is preserved but inert

#### Scenario: Enabling haptics fires a tap on +/- presses
- **GIVEN** the user is on iOS or Android with Haptic feedback enabled
- **WHEN** the user taps "+" on the life counter
- **THEN** the device fires a brief haptic tap (selection-style feedback)
- **AND** the life total still increments by 1

#### Scenario: First launch default is disabled
- **GIVEN** no settings have been persisted (first launch)
- **WHEN** the Settings screen is rendered on a mobile device
- **THEN** Haptic feedback is in the disabled state

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
