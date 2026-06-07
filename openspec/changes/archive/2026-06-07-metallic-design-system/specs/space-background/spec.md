## MODIFIED Requirements

### Requirement: Background motion is gated by a Settings toggle and reduce-motion
The starfield SHALL animate (a slow parallax drift, with a subtle per-layer opacity breath) only when the persisted **`animatedBackground`** is on **and** the global **`enableAnimations`** is on. These are no longer two separate Settings toggles — a **single "Enable animations" toggle** now governs both (it writes the same value to each), so the starfield animates exactly when "Enable animations" is on. In any other case the identical starfield SHALL render **statically** (stars at rest, no running timers) — the backdrop is never hidden, only stilled. Toggling it off SHALL NOT cause a layout shift.

#### Scenario: Animation on by default
- **GIVEN** a fresh install (no settings saved)
- **WHEN** any screen renders
- **THEN** the starfield is animated (drifting)

#### Scenario: Turning Enable animations off stills the stars
- **GIVEN** animations are enabled
- **WHEN** the user turns the single **"Enable animations"** toggle off in Settings
- **THEN** the same starfield is shown but no longer moves
- **AND** no layout shift occurs

#### Scenario: A legacy animatedBackground=false also stills the background
- **GIVEN** a persisted `animatedBackground` of `false` (e.g. saved before the two toggles were merged) with `enableAnimations` still on
- **WHEN** a screen renders
- **THEN** the starfield is rendered statically (motion requires BOTH `animatedBackground` and `enableAnimations`)
