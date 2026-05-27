## REMOVED Requirements

### Requirement: Life Mode selector offers Count Down and Count Up
**Reason**: The Count Up / Count Down distinction was a thin behavioral difference (only the lower clamp differed) dressed up as a major mode setting. Collapsing it into a single "Initial life points" number — with the input range broadened to `[0, 99]` so "count up from 0" is directly pickable — removes a confusing UI layer without losing practical functionality.

**Migration**: `SettingsContext.sanitize()` handles `lifeMode` during a one-time read migration: persisted `lifeMode: "up"` maps to `initialLife: 0` (preserving the prior up-mode behavior); persisted `lifeMode: "down"` keeps the existing `startingLife` as the new `initialLife`. The `lifeMode` key is no longer written by `updateSettings`, so it fades out of persisted storage on the next save.

## MODIFIED Requirements

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

### Requirement: Initial life points is configurable via typed input, stepper, and quick-pick presets
The **Initial Life Points** section SHALL allow the user to set a value in the range **[0, 99]** via any of three controls:
- A numeric `TextInput` that accepts typed values. The committed value SHALL be a valid integer in `[0, 99]`; invalid input (out of range, non-integer, empty) SHALL revert to the previous valid value with brief inline feedback.
- A `+` / `−` stepper that clamps to `[0, 99]`.
- Static quick-pick chips for **20, 25, 30, 40**; tapping a chip sets the value.

The default value SHALL be **30**.

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

#### Scenario: Quick-pick preset sets the value directly
- **GIVEN** Initial Life is 25
- **WHEN** the user taps a "40" preset chip
- **THEN** Initial Life becomes 40

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

## ADDED Requirements

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
