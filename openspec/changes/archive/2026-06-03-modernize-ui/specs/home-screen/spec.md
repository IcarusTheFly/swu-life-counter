## ADDED Requirements

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
