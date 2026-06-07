## MODIFIED Requirements

### Requirement: Screens share a consistent modernized metallic surface system
The app's screens SHALL build on the new `design-system` tokens and the `components/ui` kit: brushed-**silver** metallic surfaces with **dark, high-contrast** text and a **gold** secondary accent, floating over the **unchanged** shared space backdrop. This metallic + gold language SHALL be applied to **Home**, **Decks**, **Settings**, and the **deck detail** screens. The **life counter** (the in-game screen) SHALL receive only **minimal, token-level** changes (shared colors / typography); its layout, its controls, and the initiative bubble SHALL be unchanged. This modernization SHALL remain **visual only**: it SHALL NOT change any screen's layout structure, navigation, flows, or recorded-data behavior. Existing functional requirements of other capabilities (home-screen, settings, decks, game-screen, navigation) remain in force unchanged.

#### Scenario: Cohesive silver + gold across the browse screens
- **WHEN** the user moves between Home, Decks, Deck Detail, and Settings
- **THEN** surfaces are brushed silver with dark high-contrast text and a gold secondary accent, built from the design-system tokens and the `components/ui` kit
- **AND** they read as one cohesive metallic-on-space system over the unchanged space backdrop

#### Scenario: The life counter is only minimally changed
- **WHEN** the in-game life counter is shown
- **THEN** it picks up only token-level color / typography changes
- **AND** its layout, its controls, and the initiative bubble are unchanged

#### Scenario: No behavioral regression from the refresh
- **WHEN** the user performs any existing action (start a game, edit a deck, record a game, change a setting)
- **THEN** the behavior is identical to before the visual refresh

## ADDED Requirements

### Requirement: Every screen lays out cleanly in landscape
Every screen (Home, Decks, Settings, deck detail, game history, bulk add, and the life counter) SHALL lay out in **landscape** without content **out of place**: no element SHALL overflow the screen horizontally (nothing runs off the left/right edge), no control SHALL be permanently clipped or rendered behind the bottom tab bar, and all primary actions SHALL remain reachable (scrolling allowed). Where the short landscape layout cannot fit a **non-essential** element above the tab bar, that element SHALL be **omitted in landscape** (kept in portrait) rather than left overlapping — e.g. Home's Exit control.

#### Scenario: Landscape has no horizontal overflow
- **GIVEN** any screen in a landscape viewport (e.g. 880×420)
- **WHEN** it renders
- **THEN** its content does not extend horizontally past the screen edges (no sideways scroll)
- **AND** the bottom tab bar (where shown) is fully visible and does not overlap interactive content

#### Scenario: Non-fitting landscape elements are omitted, not overlapped
- **GIVEN** a short landscape layout where a non-essential footer control would fall behind the tab bar
- **WHEN** the screen renders in landscape
- **THEN** that control is omitted in landscape (it remains in portrait) rather than rendered out of place
