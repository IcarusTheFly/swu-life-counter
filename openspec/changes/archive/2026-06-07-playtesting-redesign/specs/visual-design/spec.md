## ADDED Requirements

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
