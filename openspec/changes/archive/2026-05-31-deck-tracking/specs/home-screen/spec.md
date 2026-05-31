## ADDED Requirements

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
