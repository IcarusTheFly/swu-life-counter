## REMOVED Requirements

### Requirement: Settings provides an Exit control
**Reason**: Exit is being relocated to the Home screen so Settings stays a pure preferences surface (Team Colors, Initial Life, Animations, Haptics). Keeping the only app-quit affordance on Home — the app's entry point — matches user expectation and de-clutters Settings. The platform behavior is unchanged; only its location moves (see the `home-screen` capability's "Home screen provides Start Game, Settings, and Exit options" requirement).

**Migration**: No data or settings change. The Exit row/button is removed from the Settings screen and added to Home, gated by the same rule (Android/web only; omitted on iOS) and using the same mechanism (`BackHandler.exitApp()` on Android, `window.close()` on web).

## MODIFIED Requirements

### Requirement: Animated background is a persisted, toggleable setting
The persisted settings SHALL include a boolean **`animatedBackground`** (default **`true`**), coerced to a boolean on read with missing/invalid values defaulting to `true` (so pre-existing blobs read as enabled). The Settings screen SHALL NOT present a SEPARATE "Animated background" toggle; instead the single **"Enable animations"** toggle (in the Animations section) governs BOTH `enableAnimations` and `animatedBackground` together — toggling it writes the same value to both, because to the user they are the same thing. The backdrop's motion remains the combination of `animatedBackground` AND `enableAnimations` (it animates only when both are on); because the single toggle keeps them in sync, turning animations off makes the backdrop static.

#### Scenario: One toggle governs both UI animations and the background
- **GIVEN** the Settings Animations section
- **WHEN** the Settings screen renders
- **THEN** exactly one toggle ("Enable animations") is shown — there is NO separate "Animated background" toggle
- **WHEN** the user turns it off
- **THEN** both `enableAnimations` and `animatedBackground` are persisted as `false` and the backdrop is static
- **WHEN** the user turns it on
- **THEN** both are persisted as `true` and the backdrop animates

#### Scenario: Legacy settings read as enabled
- **GIVEN** a persisted settings blob saved before this change (no `animatedBackground` key)
- **WHEN** settings hydrate
- **THEN** `animatedBackground` resolves to `true`

#### Scenario: Invalid value is coerced
- **GIVEN** a persisted `animatedBackground` that is not a boolean (e.g. a string)
- **WHEN** settings hydrate
- **THEN** it is coerced to a boolean (defaulting to `true` when not clearly false)
