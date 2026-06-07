## ADDED Requirements

### Requirement: A single source defines the metallic + gold design tokens
The app SHALL define its visual design tokens in **one pure tokens module** (no React, no platform imports) that is the single source of truth for the metallic + gold language. This module SHALL define, at minimum:
- the **metallic gradients** — **silver**, **gold**, **steel**, and **crimson**;
- a **gold** secondary / glow accent (matching the app icon) used for emphasis;
- a **contrast-tiered text scale** with **primary**, **secondary**, and **muted** tiers for BOTH light-metal surfaces (dark text) and dark-space surfaces (light text);
- **surface** and **border** colors for the metallic surfaces;
- a **type scale** (named sizes / weights);
- a **spacing** scale;
- **corner radii**; and
- **elevation** (shadow) tokens.

Screens and components SHALL reference these tokens rather than hard-coding their own metallic gradients, text colors, spacing, or radii. There SHALL NOT be bespoke per-screen copies of the metallic palette.

#### Scenario: Tokens exist as one importable source
- **WHEN** any screen or component needs a metallic gradient, an accent, a text-tier color, a surface/border color, a type-scale entry, a spacing value, a radius, or an elevation
- **THEN** it imports that value from the single design-tokens module
- **AND** that module exposes all of: silver/gold/steel/crimson gradients, a gold glow accent, primary/secondary/muted text tiers for light-metal and dark-space surfaces, surface + border colors, a type scale, spacing, radii, and elevation

#### Scenario: A screen styles from tokens, not bespoke copies
- **WHEN** a screen renders a metallic surface, an accent, or text
- **THEN** its colors, spacing, radii, and elevation come from the shared tokens
- **AND** the screen does NOT define its own metallic gradient or text-color palette

### Requirement: Reusable UI components implement the design language
The app SHALL provide a shared UI kit under `components/ui/` that implements the metallic + gold language on top of the design tokens, so screens compose ready-made pieces instead of restyling each one. The kit SHALL include, at minimum: a **metallic card/surface**, a **metallic button**, a **gold-metal primary button**, a **header-stat** (icon + label + value), a **section label**, a **full-width select row** (label + wide dropdown), and a **sparkline**. Each component SHALL draw its appearance from the design tokens.

#### Scenario: The UI kit exists
- **WHEN** the project is inspected
- **THEN** `components/ui/` provides a metallic card/surface, a metallic button, a gold-metal primary button, a header-stat, a section label, a full-width select row, and a sparkline
- **AND** each component derives its colors, spacing, radii, and elevation from the design tokens

#### Scenario: Screens build surfaces and buttons from the kit
- **WHEN** a screen renders a card surface, a primary action, a secondary button, a stat, a section heading, a dropdown row, or a recent-form chart
- **THEN** it composes the corresponding `components/ui/` component rather than re-implementing the metallic styling inline

#### Scenario: A new screen stays consistent by using the kit
- **GIVEN** a new screen is added to the app
- **WHEN** it is built from the `components/ui/` kit and the design tokens
- **THEN** it reads as part of the same metallic + gold product without bespoke styling

### Requirement: Silver is paired with a gold secondary accent at high contrast
The design language SHALL use brushed **silver** as the base metal and **gold** as the secondary accent. Gold SHALL be applied to the **primary call-to-action** (a **gold-metal surface**, not a surrounding glow/ring) and **selected** highlights (e.g. a selected filter chip, an active preset, a selected picker row). The **header icons (including the Best Deck crown)** and the **active tab indicator** are NOT gold — they use the neutral dark metal tone — so gold stays reserved for the primary action and explicit selection. Text rendered on silver or gold (light-metal) surfaces SHALL use the **dark** high-contrast text tiers so it remains legible over the metal.

#### Scenario: The primary action is gold metal, not a contour
- **WHEN** the primary call-to-action (the gold-metal primary button) is rendered
- **THEN** its emphasis comes from a **gold-metal fill** with a neutral bevel and dark text
- **AND** it does NOT have a surrounding gold ring / contour around a silver body

#### Scenario: Selected states use gold; header icons do not
- **WHEN** an element is in a **selected** state (a selected filter chip, an active preset, a selected picker row)
- **THEN** the highlight uses the gold accent
- **AND** the header stat icons (including the Best Deck crown) and the active tab indicator do NOT use gold — they use the neutral dark metal tone

#### Scenario: Text on silver surfaces is high-contrast
- **WHEN** text is placed on a silver (light-metal) surface
- **THEN** it uses a dark text tier (primary / secondary / muted) for high contrast, not a light color that would wash out
