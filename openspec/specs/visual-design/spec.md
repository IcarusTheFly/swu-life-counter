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
