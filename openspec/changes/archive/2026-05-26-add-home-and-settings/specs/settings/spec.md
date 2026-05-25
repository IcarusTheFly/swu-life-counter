## ADDED Requirements

### Requirement: Settings screen exposes Team Colors and Life Mode controls
The Settings screen SHALL contain two clearly labeled sections: **Team Colors** and **Life Mode**. A back affordance (chevron in the top-left) SHALL return the user to Home.

#### Scenario: Settings screen layout
- **WHEN** the Settings screen is rendered
- **THEN** a back chevron is visible in the top-left
- **AND** a "Settings" title is visible
- **AND** a "Team Colors" section is rendered
- **AND** a "Life Mode" section is rendered

#### Scenario: Back chevron returns to Home
- **WHEN** the user taps the back chevron on the Settings screen
- **THEN** the Home screen is shown
- **AND** any changes the user made are preserved (already persisted at the moment of change)

### Requirement: Team color palette offers at least 4 colors per side
The Team Colors section SHALL render two sub-sections, one for **Player** and one for **Opponent**. Each sub-section SHALL display a palette of at least 4 distinct colors. The user SHALL be able to select one color per side. The same color MAY be chosen for both sides.

#### Scenario: Palette renders for both sides
- **WHEN** the Settings screen is rendered
- **THEN** the Team Colors section shows two rows (Player, Opponent)
- **AND** each row shows at least 4 selectable color swatches

#### Scenario: Selecting a color for Player
- **GIVEN** the Player row currently shows green as selected
- **WHEN** the user taps the blue swatch in the Player row
- **THEN** the Player selection updates to blue
- **AND** the blue swatch shows a selected-state indicator (e.g., a white ring)
- **AND** the green swatch no longer shows the selected-state indicator

#### Scenario: Both players may share a color
- **GIVEN** Player is currently green and Opponent is currently red
- **WHEN** the user taps green in the Opponent row
- **THEN** the Opponent selection updates to green
- **AND** no error is shown

#### Scenario: Swatches meet minimum tap-target size
- **WHEN** color swatches are rendered
- **THEN** each swatch has a tappable area of at least 44 × 44 points

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

### Requirement: Life Mode selector offers Count Down and Count Up
The Life Mode section SHALL contain a two-option selector: **Count Down** and **Count Up**. The selected option SHALL be visually distinct.

#### Scenario: Default mode is Count Down
- **WHEN** the Settings screen is rendered for the first time (no persisted setting)
- **THEN** the Life Mode selector shows "Count Down" as selected

#### Scenario: Switching to Count Up hides the Starting Life stepper
- **GIVEN** Life Mode is currently "Count Down" and the Starting Life stepper is visible
- **WHEN** the user taps "Count Up"
- **THEN** the selector shows "Count Up" as selected
- **AND** the Starting Life stepper is hidden (Count Up always starts at 0)

#### Scenario: Switching to Count Down reveals the Starting Life stepper
- **GIVEN** Life Mode is currently "Count Up"
- **WHEN** the user taps "Count Down"
- **THEN** the selector shows "Count Down" as selected
- **AND** the Starting Life stepper is visible, showing the persisted starting-life value (default 30)

### Requirement: Starting Life is configurable when Count Down is selected
When **Count Down** is selected, a Starting Life stepper SHALL allow the user to set a value between **1 and 99**. The default SHALL be **30**. Quick-pick presets for **20, 25, 30, and 40** SHALL be available.

#### Scenario: Increment and decrement starting life
- **GIVEN** Starting Life is 30
- **WHEN** the user taps the "+" button on the stepper
- **THEN** Starting Life becomes 31
- **WHEN** the user taps the "−" button on the stepper
- **THEN** Starting Life becomes 30

#### Scenario: Starting Life is clamped to 1–99
- **GIVEN** Starting Life is 99
- **WHEN** the user taps the "+" button
- **THEN** Starting Life remains 99 (does not exceed 99)
- **GIVEN** Starting Life is 1
- **WHEN** the user taps the "−" button
- **THEN** Starting Life remains 1 (does not go below 1)

#### Scenario: Quick-pick preset sets the value directly
- **GIVEN** Starting Life is 25
- **WHEN** the user taps the "40" preset
- **THEN** Starting Life becomes 40

### Requirement: Life Mode and Starting Life apply at game start
The chosen Life Mode and Starting Life SHALL determine the initial life totals of the next game. Changing these settings SHALL NOT affect an already-running game (Settings is only reachable from Home, so this is naturally enforced).

#### Scenario: Count Down starts at the chosen value
- **GIVEN** the user has set lifeMode `down` and startingLife `40`
- **WHEN** the user starts a game
- **THEN** both players begin with 40 life

#### Scenario: Count Up starts at 0
- **GIVEN** the user has set lifeMode `up`
- **WHEN** the user starts a game
- **THEN** both players begin with 0
- **AND** tapping "+" increases the value (toward 99)
- **AND** tapping "−" decreases the value but does not go below 0

#### Scenario: In-game Reset uses the values active at game start
- **GIVEN** the user started a Count Down game at startingLife 40, then reduced their life to 12
- **WHEN** the user taps the reset icon and then "Reset Life"
- **THEN** both players return to 40 (the value at game start)

### Requirement: Life value is clamped per mode
Life values SHALL be clamped to a per-mode range to keep the display readable and prevent meaningless states.

#### Scenario: Count Down upper and lower clamp
- **GIVEN** lifeMode `down`
- **WHEN** life is 99 and the user taps "+"
- **THEN** life remains 99
- **WHEN** life is -9 and the user taps "−"
- **THEN** life remains -9 (preserves existing behavior)

#### Scenario: Count Up upper and lower clamp
- **GIVEN** lifeMode `up`
- **WHEN** life is 99 and the user taps "+"
- **THEN** life remains 99
- **WHEN** life is 0 and the user taps "−"
- **THEN** life remains 0 (going negative on a damage counter is meaningless)

### Requirement: Settings persist across app launches
All settings (player1Color, player2Color, lifeMode, startingLife) SHALL be persisted to local storage and restored on subsequent launches.

#### Scenario: Settings survive an app restart
- **GIVEN** the user has set Player = purple, Opponent = yellow, lifeMode `up`
- **WHEN** the user fully closes and reopens the app
- **THEN** the Settings screen shows Player = purple, Opponent = yellow, lifeMode `up`
- **AND** starting a game uses those values

#### Scenario: First launch uses defaults
- **GIVEN** no settings have ever been saved
- **WHEN** the app launches
- **THEN** the in-memory settings are player1Color `green`, player2Color `red`, lifeMode `down`, startingLife `30`

#### Scenario: Persistence failure does not crash the app
- **GIVEN** a write to storage fails
- **WHEN** the user changes a setting
- **THEN** the new value applies for the current session
- **AND** no error dialog is shown to the user
- **AND** the failure is logged for diagnostics
