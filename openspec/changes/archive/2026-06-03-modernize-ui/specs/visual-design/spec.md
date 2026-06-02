## ADDED Requirements

### Requirement: Confirmation dialogs use the metallic design language
All confirmation dialog action buttons (`ConfirmationModal`) SHALL use the app's **metallic** visual language instead of flat saturated fills. The available variants are:
- **Player / affirmative** actions → **metallic silver** (white text).
- **Opponent** actions → **metallic gold** (dark text).
- **Draw** → a distinct cool **slate-blue**.
- **Destructive** actions → **metallic crimson** (a desaturated, on-theme red — not flat `#8B0000`).
- **Neutral / cancel** actions → a muted **dark steel** treatment.

An action MAY also carry a per-action custom gradient + text color that overrides its variant — used by the in-game outcome prompt to tint each win button with that side's **team color**.

The change SHALL apply everywhere the shared dialog is used (the in-game "Return to Home" / Reset dialog, the end-game outcome prompt, and the deck-delete confirmation) without changing the dialog's `actions` API or behavior. The dialog's entry animation SHALL remain gated on the global animations setting.

#### Scenario: Return-to-Home dialog is metallic
- **GIVEN** a game in progress
- **WHEN** the user opens the in-game options dialog
- **THEN** "Return to Home" and "Reset Life" are styled with metallic gradients (silver / metallic-crimson), not flat blue/red
- **AND** "Cancel" uses the muted neutral treatment

#### Scenario: Destructive actions read as danger without the off-theme red
- **WHEN** a destructive action (Reset Life, or a deck/game Delete) is shown in a dialog
- **THEN** it uses the metallic-crimson treatment (clearly destructive, but on-theme)

#### Scenario: The metallic restyle is behavior-preserving
- **WHEN** the user taps a dialog action
- **THEN** it performs the same behavior as before — the restyle changes only the button's appearance, not what it does (any label/order changes to the in-game outcome prompt are specified separately under `game-screen`)

### Requirement: Screens share a consistent modernized metallic surface system
The app's screens SHALL present a consistent modernized look built on shared tokens — metallic gradients (silver / gold / crimson / steel), card surfaces, spacing, and corner radii — applied over the shared space backdrop. This modernization SHALL be **visual only**: it SHALL NOT change any screen's layout structure, navigation, flows, or recorded-data behavior. Existing functional requirements of other capabilities (home-screen, settings, decks) remain in force unchanged.

#### Scenario: Consistent surfaces over the backdrop
- **WHEN** the user moves between Home, Decks, Deck Detail, and Settings
- **THEN** surfaces, accents, and typography read as one cohesive metallic-on-space system

#### Scenario: No behavioral regression from the refresh
- **WHEN** the user performs any existing action (start a game, edit a deck, record a game, change a setting)
- **THEN** the behavior is identical to before the visual refresh
