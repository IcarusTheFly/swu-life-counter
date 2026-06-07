# space-background Specification

## Purpose

The `space-background` capability defines the shared animated space backdrop rendered behind every screen of the app, the Settings/reduce-motion gating of its motion, and the in-game team-colored curved-line overlay that appears on top of the space only during a game.

## Requirements

### Requirement: A shared animated space background renders behind every screen
The app SHALL render a single shared space backdrop — a deep-space gradient with a procedurally-rendered starfield — **behind every screen** (Home, Settings, Decks, Deck Detail, Deck Edit, Game History, Bulk Add, and the in-game life counter). The backdrop SHALL be mounted once at the app shell so it is continuous across navigation (no flash or re-seed when switching screens). Screen content SHALL sit above the backdrop; opaque cards, sheets, and dialogs retain their own surfaces for legibility.

#### Scenario: Space shows on a non-game screen
- **WHEN** the user opens the Home, Settings, or Decks screen
- **THEN** the space backdrop (gradient + stars) is visible behind the screen's content
- **AND** the screen's text and cards remain legible above it

#### Scenario: Backdrop is continuous across navigation
- **WHEN** the user navigates from one screen to another
- **THEN** the backdrop does not flash, reset, or visibly re-seed (it is the same persistent layer)

### Requirement: Background motion is gated by a Settings toggle and reduce-motion
The starfield SHALL animate (a slow parallax drift, with a subtle per-layer opacity breath) only when the **Animated background** setting is on **and** the global **Enable animations** setting is on. In any other case the identical starfield SHALL render **statically** (stars at rest, no running timers) — the backdrop is never hidden, only stilled. Toggling motion off SHALL NOT cause a layout shift.

#### Scenario: Animation on by default
- **GIVEN** a fresh install (no settings saved)
- **WHEN** any screen renders
- **THEN** the starfield is animated (drifting)

#### Scenario: Disabling the animated-background toggle stills the stars
- **GIVEN** animations are enabled
- **WHEN** the user turns the "Animated background" toggle off in Settings
- **THEN** the same starfield is shown but no longer moves
- **AND** no layout shift occurs

#### Scenario: Global reduce-motion also stills the background
- **GIVEN** the "Animated background" toggle is on
- **WHEN** the user turns the global "Enable animations" setting off
- **THEN** the starfield is rendered statically (reduce-motion wins)

### Requirement: In-game team-colored curved lines overlay the space, only during a game
During a game, each side's **team-colored curved lines** SHALL be rendered as a **transparent overlay on top of** the shared animated space, using that side's selected team color and the existing per-half orientation (the opponent half mirrored 180°). These curved lines SHALL appear **only** in the in-game life counter — they SHALL NOT appear on any other screen. The lines SHALL adapt to portrait and landscape using the orientation-appropriate overlay.

#### Scenario: Lines appear over the space in-game
- **GIVEN** Player color = green and Opponent color = red
- **WHEN** a game starts
- **THEN** the animated space is visible behind both halves
- **AND** green curved lines overlay the player half and red curved lines overlay the opponent half, on top of the space

#### Scenario: Lines are absent outside a game
- **WHEN** the user is on any non-game screen (Home, Settings, Decks, …)
- **THEN** the space backdrop is shown WITHOUT the team-colored curved lines

#### Scenario: Orientation-correct overlay
- **GIVEN** an in-game session
- **WHEN** the device is rotated between portrait and landscape
- **THEN** the curved-line overlay uses the orientation-appropriate variant and stays aligned to each half

### Requirement: The space backdrop palette is neutral deep-space with a dense starfield
The shared space backdrop's gradient SHALL be a **neutral** deep-space palette (near-black greys) with **no blue/indigo cast** — the previous navy/indigo tint SHALL be removed, including the solid fallback base tone. The starfield SHALL be **denser** than the previous field while preserving the performance contract: motion SHALL continue to use a small fixed number of animated drivers (one per parallax layer), so increasing the star count does NOT increase the number of running animations. The existing gating (the **Animated background** setting + global **Enable animations** / reduce-motion) and the static-when-off behavior SHALL be unchanged.

#### Scenario: Backdrop has no blue cast
- **WHEN** any screen renders the space backdrop
- **THEN** the gradient reads as neutral near-black deep space (no visible navy/indigo tint)

#### Scenario: Denser starfield
- **WHEN** the backdrop renders
- **THEN** the starfield is visibly denser than the prior field

#### Scenario: Density does not add animations
- **WHEN** the animated backdrop runs
- **THEN** it still uses one animated driver per parallax layer (the higher star count adds only static elements, not new timers)

#### Scenario: Gating unchanged
- **GIVEN** the "Animated background" or the global "Enable animations" setting is off
- **WHEN** the backdrop renders
- **THEN** the denser starfield renders statically (no running timers), exactly as before
