## ADDED Requirements

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
