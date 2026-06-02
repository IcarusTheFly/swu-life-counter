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
