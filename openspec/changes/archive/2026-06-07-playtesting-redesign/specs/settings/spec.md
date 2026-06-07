## ADDED Requirements

### Requirement: Settings provides an Exit control
The Settings screen SHALL provide an **Exit** control (a row/button) on every platform **except iOS**, where it SHALL be omitted (Apple HIG forbids programmatic termination). Tapping it SHALL close the app via the platform-appropriate mechanism — Android `BackHandler.exitApp()`, web `window.close()` (which may no-op for tabs the user opened themselves — a browser constraint, not a bug). This relocates the former Home Exit control.

#### Scenario: Exit control on Android/web
- **GIVEN** the app runs on Android or web
- **WHEN** the Settings screen is rendered
- **THEN** an Exit control is visible
- **WHEN** the user taps it
- **THEN** the app attempts to close via the platform mechanism

#### Scenario: No Exit on iOS
- **GIVEN** the app runs on iOS
- **WHEN** the Settings screen is rendered
- **THEN** no Exit control is rendered
