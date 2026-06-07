## MODIFIED Requirements

### Requirement: Home screen is the app entry point
The app SHALL display a Home screen on launch (after font and settings load), instead of mounting the life counter directly.

#### Scenario: Cold launch shows Home
- **WHEN** the user opens the app from a fresh launch
- **THEN** the Home screen is shown after fonts and persisted settings have loaded
- **AND** the life counter is not visible

#### Scenario: Home screen displays the app title
- **WHEN** the Home screen is rendered
- **THEN** the screen shows the app title "SWU Playtesting" using the `FiraCode_700Bold` font (a compact header — no separate subtitle line)

### Requirement: Home screen provides Start Game, Settings, and Exit options
The Home screen SHALL be a **dashboard**, not a menu — surfacing the user's playtesting at a glance and offering a fast way to play:
- A **top-performer** feature (see "Home features a top-performer deck").
- A **top decks** list — a few of the user's best decks as compact rows (see "The Home deck list shows each deck's test record"); the **full** list lives in the **Decks** tab.
- A **Play Now** block — the Player/Opponent loadout + a single primary **Play** action.

Navigation to **Decks** and **Settings** is provided by the **bottom tab bar** (see the `navigation` capability), NOT by controls on Home. **Exit** is provided by the Settings screen (see the `settings` capability), not by Home. Home content SHALL be scrollable when it exceeds the viewport, and all tappable controls SHALL meet the minimum tap-target size.

#### Scenario: Home is a dashboard
- **WHEN** the Home screen renders with decks + recorded games
- **THEN** a featured top-performer deck, a short top-decks list, and a Play Now block are shown

#### Scenario: Area navigation is the tab bar, not Home
- **WHEN** the Home screen renders
- **THEN** Home itself does NOT render Decks / Settings / Exit buttons (those live in the tab bar / Settings)

#### Scenario: Controls meet minimum tap-target size
- **WHEN** any Home control (a deck's Test button, Play, or a dropdown) is rendered
- **THEN** its tappable area is at least 44 × 44 points

### Requirement: Start Game launches the life counter using current settings
Starting a test game — via **Play Test Game** (Quick Test) or a deck's **Test** action — SHALL transition the app from Home to the life counter screen, initialized using the persisted settings (team colors, life mode, starting life). A deck's **Test** action SHALL first set that deck as the player side of `activeLoadout`.

#### Scenario: Play Test Game in Count Down mode with starting life 30
- **GIVEN** persisted settings: lifeMode `down`, startingLife `30`, player1Color `green`, player2Color `red`
- **WHEN** the user taps "Play Test Game"
- **THEN** the life counter is shown
- **AND** both players' life totals start at 30
- **AND** the player1 press-feedback tint is the green palette color and player2's tint is the red palette color

#### Scenario: A deck's Test action starts a test with that deck
- **WHEN** the user taps **Test** on a deck row
- **THEN** that deck becomes the player side of `activeLoadout`
- **AND** the life counter is shown, initialized from the persisted settings

#### Scenario: Play Test Game in Count Up mode
- **GIVEN** persisted settings: lifeMode `up`
- **WHEN** the user taps "Play Test Game"
- **THEN** the life counter is shown with both players' values starting at 0

### Requirement: Android hardware back button returns to Home from Game and Settings
On Android, the hardware back button SHALL behave consistently with the bottom tab bar: from a non-Home tab (Decks or Settings) or one of their sub-screens, back SHALL return to the **Home** tab; from a **game**, back SHALL return to Home and discard the in-game state; from the **Home** tab, back SHALL exit the app (default Android behavior — not overridden).

#### Scenario: Hardware back from a non-Home tab
- **GIVEN** the user is on the Decks or Settings tab on Android
- **WHEN** the user presses the hardware back button
- **THEN** the Home tab is shown

#### Scenario: Hardware back from Game
- **GIVEN** the user is on the Game screen on Android
- **WHEN** the user presses the hardware back button
- **THEN** the Home screen is shown
- **AND** the in-game state is discarded

#### Scenario: Hardware back from Home exits the app
- **GIVEN** the user is on the Home tab on Android
- **WHEN** the user presses the hardware back button
- **THEN** the default OS behavior occurs (the app moves to background or exits)

### Requirement: Home exposes inline deck dropdowns and a Decks entry point
The Home screen's **Play Now** block SHALL present two inline dropdowns — **Player** and **Opponent** — each drawing from the single shared deck list and each additionally offering **Random**; selecting in either persists `settings.activeLoadout`. The decks shown on Home SHALL open their detail on tap. The **full** deck list and deck creation are reached via the **Decks** tab (the `navigation` capability), not a Home button. When no decks exist, the dropdowns SHALL still offer a "Create a deck" affordance and **Play** SHALL still work (an untracked test).

#### Scenario: Two dropdowns drive the loadout
- **WHEN** the Home screen renders with decks present
- **THEN** the Play Now Player and Opponent dropdowns are visible, each showing the current selection (aspect dot + name, or "Random")
- **AND** each dropdown's options include every deck plus "Random"

#### Scenario: Selecting decks updates the loadout
- **WHEN** the user picks Player = deck A and Opponent = deck B in Play Now
- **THEN** `activeLoadout` becomes `{player1DeckId: A, player2DeckId: B}`
- **WHEN** the user taps Play
- **THEN** the test game starts with that matchup

#### Scenario: Opening a deck from Home
- **WHEN** the user taps a deck shown on Home
- **THEN** that deck's detail screen is shown

#### Scenario: Empty state still lets you play
- **GIVEN** no decks exist
- **WHEN** the Home screen renders
- **THEN** the dropdowns offer a "Create a deck" affordance and Play still starts an untracked test

### Requirement: The Home screen layout adapts to orientation
The Home dashboard SHALL lay out its content (top-performer feature, top-decks list, Play Now) so it is reachable in BOTH orientations without permanent clipping, scrolling above the bottom tab bar as needed. Portrait MAY use a single scrollable column; landscape SHALL keep the top-performer / decks and the Play Now action reachable (e.g. a two-column or scrollable arrangement). Content and behavior SHALL be identical across orientations (a layout adaptation only).

#### Scenario: Landscape keeps the dashboard reachable
- **GIVEN** a short landscape viewport (e.g. 812×375)
- **WHEN** the Home screen renders
- **THEN** the top-performer feature, the top-decks list, and the Play Now block are all reachable (scrolling allowed; nothing permanently clipped) above the tab bar

#### Scenario: Portrait is a scrollable column
- **GIVEN** a portrait viewport
- **WHEN** the Home screen renders
- **THEN** the dashboard sections are shown in a scrollable vertical stack above the tab bar

## ADDED Requirements

### Requirement: Home shows an at-a-glance stats overview
The Home screen SHALL display a compact, read-only stat strip beneath the brand summarizing the user's tracked play — at minimum the **number of decks** and the **number of recorded games** — computed from the persisted decks/games. It SHALL NOT present a single global "win rate" across all decks: an aggregate win percentage over many different decks and matchups is not a meaningful figure. Relative performance is expressed instead by the featured **top-performer** deck and the **ranked** top-decks list. When there is no recorded data yet, the strip SHALL show a friendly call-to-action instead of zeroes. The strip is informational only and SHALL NOT alter recorded data.

#### Scenario: Overview reflects tracked counts
- **GIVEN** the user has 12 decks and 84 recorded games
- **WHEN** the Home screen renders
- **THEN** the stat strip shows the deck count (12) and the game count (84)
- **AND** it does NOT show a single global win-percentage figure

#### Scenario: Empty state shows a call-to-action
- **GIVEN** no games have been recorded
- **WHEN** the Home screen renders
- **THEN** the stat strip shows a friendly prompt rather than zeroes

#### Scenario: Overview is read-only
- **WHEN** the stat strip is displayed
- **THEN** it does not modify any deck, game, or setting (it only reflects stored data)

### Requirement: The Home deck list shows each deck's test record
Each deck shown in the Home **top-decks list** SHALL display, at minimum: the deck's aspect indicator and name, its win–loss record, and its win percentage (computed from the recorded games for that deck), plus a one-tap **Test** action. A deck with no recorded games SHALL show a neutral "no games yet" indication rather than a misleading 0%.

#### Scenario: A deck row shows its record
- **GIVEN** a deck with 18 wins and 7 losses
- **WHEN** the Home top-decks list renders that deck
- **THEN** the row shows the deck name, its record (18–7), and its win percentage (~72%), plus a Test action

#### Scenario: A deck with no games
- **GIVEN** a deck with no recorded games
- **WHEN** the Home top-decks list renders that deck
- **THEN** the row shows a neutral "no games yet" state rather than "0%"

### Requirement: Home features a top-performer deck
The Home dashboard SHALL feature the user's **top-performing deck** — the deck with the highest win percentage among decks with at least a minimum number of recorded games (so a tiny sample cannot top the ranking) — as a prominent card showing at least its name, aspect, win–loss record, and win percentage. When no deck has enough games to rank, Home SHALL feature the most-played deck (or, with no decks at all, show a create-deck call-to-action) rather than a misleading 100%.

#### Scenario: Best deck is featured
- **GIVEN** several decks with enough recorded games, one with the highest win%
- **WHEN** the Home screen renders
- **THEN** that deck is featured as the top performer with its record + win%

#### Scenario: Sparse data does not fake a leader
- **GIVEN** no deck has reached the minimum ranked games
- **WHEN** the Home screen renders
- **THEN** Home features the most-played deck (or a create-deck CTA when there are no decks) instead of a misleading 100%-from-one-game deck

## REMOVED Requirements

### Requirement: Settings option opens the Settings screen
**Reason**: Settings is now reached via the bottom Settings tab (the new `navigation` capability), not a Home control.
**Migration**: Tap the Settings tab in the bottom tab bar.

### Requirement: Exit option closes the app where the platform permits
**Reason**: Exit moved off Home into the Settings screen.
**Migration**: Use the Exit control in Settings (see the `settings` capability).
