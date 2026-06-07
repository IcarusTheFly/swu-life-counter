# visual-design Specification

## Purpose

The `visual-design` capability defines the app's shared modernized metallic design language — the confirmation-dialog button variants and the consistent metallic surface system (gradients, cards, spacing, corner radii) applied over the shared space backdrop. It is a visual layer: it governs appearance, not behavior, layout structure, navigation, or recorded-data flows of other capabilities.

## Requirements

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

### Requirement: The app uses custom brand icon assets
The app SHALL be named **SWU Playtesting** — the `app.json` `expo.name` display name and the in-app brand title (a compact header, no separate subtitle). The `slug` and EAS identifiers (`extra.eas.projectId`) are unchanged. The app's icon and brand assets SHALL be **custom-authored art provided with the project** (not generated at build time), applied consistently across every slot: the launcher / store `icon` (from which the Google Play Store and Android launcher icons derive), the Android `adaptiveIcon` foreground, the web `favicon` (including `public/favicon.ico`, which the web dev server and `expo export` serve from the public root), and the `splash`. The splash and adaptive **backgrounds** SHALL be a dark tone (not white). This is a packaging/identity requirement only — the icon is NOT rendered in-app, and nothing changes in `app.json` other than the display name, the icon asset paths, and the splash/adaptive background colors.

#### Scenario: The same custom icon across every slot
- **WHEN** the app icon is shown (the Android launcher, the Google Play Store listing, the task switcher, or the web favicon / browser tab)
- **THEN** it shows the project's custom brand icon — the same mark across the launcher, favicon, and splash

#### Scenario: The app presents as SWU Playtesting
- **WHEN** the app name is shown (the launcher label, app metadata, or the Home brand title)
- **THEN** it reads "SWU Playtesting"

#### Scenario: Splash and adaptive backgrounds are dark
- **WHEN** the splash screen or Android adaptive icon is composited
- **THEN** its background is a dark tone (not `#ffffff`)
