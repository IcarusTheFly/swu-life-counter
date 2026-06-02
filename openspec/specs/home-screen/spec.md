# home-screen Specification

## Purpose

The `home-screen` capability defines the app's top-level entry screen and the navigation it exposes to the rest of the app (game, settings, and exit). It governs what is shown on launch, the order and visibility of menu options across platforms, how each option behaves, and how the user returns to Home from other screens (including the Android hardware back button).

## Requirements

### Requirement: Home screen is the app entry point
The app SHALL display a Home screen on launch (after font and settings load), instead of mounting the life counter directly.

#### Scenario: Cold launch shows Home
- **WHEN** the user opens the app from a fresh launch
- **THEN** the Home screen is shown after fonts and persisted settings have loaded
- **AND** the life counter is not visible

#### Scenario: Home screen displays the app title
- **WHEN** the Home screen is rendered
- **THEN** the screen shows the app title "SWU Life Counter" using the `FiraCode_700Bold` font

### Requirement: Home screen provides Start Game, Settings, and Exit options
The Home screen SHALL present a vertical menu containing **Start Game**, **Settings**, and **Exit** options, in that order, on every platform **except iOS**. On iOS the Exit option SHALL be omitted (Apple HIG forbids programmatic termination).

#### Scenario: Android shows three menu options
- **WHEN** the Home screen is rendered on Android
- **THEN** three buttons are visible in order: "Start Game", "Settings", "Exit"

#### Scenario: Web shows three menu options
- **WHEN** the Home screen is rendered on web
- **THEN** three buttons are visible in order: "Start Game", "Settings", "Exit"

#### Scenario: iOS hides the Exit option
- **WHEN** the Home screen is rendered on iOS
- **THEN** only two buttons are visible in order: "Start Game", "Settings"
- **AND** no Exit option is rendered (not present in the layout — not merely disabled)

#### Scenario: Menu buttons meet minimum tap-target size
- **WHEN** any menu button is rendered
- **THEN** its tappable area is at least 44 × 44 points (per iOS HIG / Material guidelines)

### Requirement: Start Game launches the life counter using current settings
Tapping **Start Game** SHALL transition the app from Home to the life counter screen, initialized using the persisted settings (team colors, life mode, starting life).

#### Scenario: Start Game in Count Down mode with starting life 30
- **GIVEN** persisted settings: lifeMode `down`, startingLife `30`, player1Color `green`, player2Color `red`
- **WHEN** the user taps "Start Game"
- **THEN** the life counter is shown
- **AND** both players' life totals start at 30
- **AND** the player1 press-feedback tint is the green palette color and player2's tint is the red palette color

#### Scenario: Start Game in Count Up mode
- **GIVEN** persisted settings: lifeMode `up`
- **WHEN** the user taps "Start Game"
- **THEN** the life counter is shown with both players' values starting at 0

### Requirement: Settings option opens the Settings screen
Tapping **Settings** SHALL transition the app from Home to the Settings screen.

#### Scenario: Tapping Settings opens Settings
- **WHEN** the user taps "Settings" on the Home screen
- **THEN** the Settings screen is shown
- **AND** the Home screen is no longer visible

### Requirement: Exit option closes the app where the platform permits
Tapping **Exit** SHALL attempt to close the app using the platform-appropriate mechanism: on Android, `BackHandler.exitApp()`; on web, `window.close()` (which may no-op for tabs the user opened themselves — that is a browser-level constraint, not a bug in the app). On iOS, no Exit option is rendered (per the prior requirement) and no equivalent shortcut exists.

#### Scenario: Tapping Exit on Android
- **GIVEN** the app is running on Android
- **WHEN** the user taps "Exit" on the Home screen
- **THEN** the app calls `BackHandler.exitApp()` and the process terminates (subject to OS behavior)

#### Scenario: Tapping Exit on web
- **GIVEN** the app is running on web
- **WHEN** the user taps "Exit" on the Home screen
- **THEN** the app calls `window.close()` (success depends on whether the tab was script-opened; no error is shown to the user if the browser declines)

### Requirement: User can return to Home from the life counter
While in the life counter, the user SHALL be able to return to the Home screen. This is exposed through the existing reset-confirmation modal (opened via the reset icon on the divider), which offers a **Return to Home** action alongside **Reset Life** and **Cancel**.

#### Scenario: Return to Home from the in-game modal
- **GIVEN** the user is in an active game with non-default life totals
- **WHEN** the user taps the reset icon on the divider
- **AND** the user taps "Return to Home"
- **THEN** the Home screen is shown
- **AND** the in-game state is discarded (no resume)

#### Scenario: Cancel keeps the user in the game
- **GIVEN** the user is in an active game and the reset modal is open
- **WHEN** the user taps "Cancel"
- **THEN** the modal closes
- **AND** life totals are unchanged

#### Scenario: Reset Life keeps the user in the game and resets totals
- **GIVEN** the user is in an active game with non-default life totals
- **AND** the game was started with startingLife 30 in Count Down mode
- **WHEN** the user taps the reset icon and then "Reset Life"
- **THEN** both players' life totals return to 30
- **AND** the user remains on the life counter screen

### Requirement: Android hardware back button returns to Home from Game and Settings
On Android, pressing the hardware back button SHALL return the user to the Home screen when they are on the Game or Settings screen. From the Home screen, the hardware back button SHALL exit the app (default Android behavior — not overridden).

#### Scenario: Hardware back from Settings
- **GIVEN** the user is on the Settings screen on Android
- **WHEN** the user presses the hardware back button
- **THEN** the Home screen is shown

#### Scenario: Hardware back from Game
- **GIVEN** the user is on the Game screen on Android
- **WHEN** the user presses the hardware back button
- **THEN** the Home screen is shown
- **AND** the in-game state is discarded

#### Scenario: Hardware back from Home exits the app
- **GIVEN** the user is on the Home screen on Android
- **WHEN** the user presses the hardware back button
- **THEN** the default OS behavior occurs (the app moves to background or exits)

### Requirement: Home exposes inline deck dropdowns and a Decks entry point
The Home screen SHALL present two always-visible inline dropdowns above the menu buttons — **Player** and **Opponent** — each drawing from the single shared deck list and each additionally offering **Random**. Selecting in either dropdown SHALL persist `settings.activeLoadout`. The Home screen SHALL also render a **Decks** menu button that navigates to the Decks screen. When no decks exist, each dropdown SHALL show a "Create a deck" affordance routing to the deck-edit screen, and Start Game SHALL still work (an untracked game).

#### Scenario: Two dropdowns drive the loadout
- **WHEN** the Home screen renders with decks present
- **THEN** a Player dropdown and an Opponent dropdown are visible, each showing the current selection (aspect dot + name, or "Random")
- **AND** each dropdown's options include every deck plus "Random"

#### Scenario: Selecting decks updates the loadout
- **WHEN** the user picks Player = deck A and Opponent = deck B
- **THEN** `activeLoadout` becomes `{player1DeckId: A, player2DeckId: B}`
- **WHEN** the user taps Start Game
- **THEN** the game starts with that matchup

#### Scenario: Empty state routes to deck creation
- **GIVEN** no decks exist
- **WHEN** the Home screen renders
- **THEN** the dropdowns offer a "Create a deck" action that opens the deck-edit screen

#### Scenario: Decks button navigates
- **WHEN** the user taps the Decks menu button
- **THEN** the Decks screen is shown

### Requirement: The Home screen layout adapts to orientation
The Home screen SHALL lay out its content so the full menu is reachable in BOTH orientations without clipping. In **portrait** it MAY use the existing centered vertical stack (brand, deck loadout, then the menu buttons). In **landscape** it SHALL use a **two-column** layout — the brand + deck loadout (Player / Opponent) on one side and the menu buttons (Start Game / Decks / Settings / Exit) on the other — vertically centered with reduced padding — so every menu button stays within the viewport. The screen's content, options, and behavior SHALL be identical across orientations (this is a layout adaptation only).

#### Scenario: Landscape does not clip the menu
- **GIVEN** a short landscape viewport (e.g. 812×375)
- **WHEN** the Home screen renders
- **THEN** all four menu buttons (Start Game, Decks, Settings, Exit) are fully within the viewport (none cut off below the fold)
- **AND** the Player + Opponent dropdowns are visible

#### Scenario: Portrait stays a centered stack
- **GIVEN** a portrait viewport
- **WHEN** the Home screen renders
- **THEN** the brand, the Player/Opponent loadout, and the menu buttons are shown in a centered vertical stack, all within the viewport
