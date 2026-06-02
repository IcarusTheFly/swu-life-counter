## ADDED Requirements

### Requirement: Animated background is a persisted, toggleable setting
The persisted settings SHALL include a boolean **`animatedBackground`** (default **`true`**). The Settings screen SHALL expose an **"Animated background"** toggle (in the Animations section) that controls whether the shared space backdrop animates. The sanitize layer SHALL coerce the value to a boolean on read and default missing/invalid values to `true`, so existing persisted blobs (which predate this key) read as enabled. Changing the toggle SHALL persist immediately, like the other settings.

The backdrop's motion is the combination of this toggle AND the existing global `enableAnimations` preference: it animates only when **both** are on; otherwise the backdrop is shown statically (see the `space-background` capability).

#### Scenario: Default is on
- **GIVEN** no settings have been saved
- **WHEN** the app launches
- **THEN** `animatedBackground` is `true` and the backdrop animates

#### Scenario: Toggle persists across launches
- **GIVEN** the user turns "Animated background" off
- **WHEN** the app is closed and reopened
- **THEN** the toggle is still off and the backdrop is static

#### Scenario: Legacy settings read as enabled
- **GIVEN** a persisted settings blob saved before this change (no `animatedBackground` key)
- **WHEN** settings hydrate
- **THEN** `animatedBackground` resolves to `true`

#### Scenario: Invalid value is coerced
- **GIVEN** a persisted `animatedBackground` that is not a boolean (e.g. a string)
- **WHEN** settings hydrate
- **THEN** it is coerced to a boolean (defaulting to `true` when not clearly false)
