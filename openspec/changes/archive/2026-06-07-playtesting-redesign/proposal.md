## Why

After `modernize-ui`, the app was a polished life counter that had quietly grown deck-tracking, win-rates, and matchups — but it still presented as a life counter. This change reframes it into **SWU Playtesting**: a deck-testing companion with a dashboard Home, standard bottom-tab navigation, an on-brand icon, and a calmer backdrop. (It consolidates a few iterations of exploration into one coherent feature.)

## What Changes

- **Rename to SWU Playtesting** — the `app.json` display name and the in-app brand (slug/EAS unchanged).
- **Bottom tab bar** (new `navigation` capability) — persistent **Home · Decks · Settings** tabs (icon + label, active highlight); hidden during a game and focused edit flows. **Exit** relocates from Home into Settings.
- **Home becomes a dashboard** — a featured **top-performer** deck, a **ranked top-decks** list (each with record + win% + a one-tap Test), and a **Play Now** loadout. The stat strip shows deck/game **counts only** — no aggregate "win rate" (a single number averaged across many decks/matchups isn't meaningful); relative performance is the top-performer ranking instead.
- **Space backdrop** — neutral near-black palette (the navy/indigo cast removed) with a **denser** starfield.
- **Icon & brand** — the app ships **custom icon art** (provided with the project) across the launcher `icon`, Android `adaptive-icon`, web `favicon` (incl. `public/favicon.ico` so the web dev server serves it), and `splash`; splash/adaptive backgrounds darkened.
- No game-rules, deck/game data, or storage changes.

## Capabilities

### New Capabilities
- `navigation`: the persistent bottom tab bar — destinations, active-tab indication, and when it is shown vs hidden.

### Modified Capabilities
- `home-screen`: Home is a dashboard (top-performer + ranked top-decks + Play Now); area navigation moves to the bottom tab bar; Exit relocates to Settings; the overview shows counts (no global win rate).
- `visual-design`: the app is named **SWU Playtesting** and its icon/brand assets are **custom-provided art** (launcher icon, adaptive icon, favicon, splash) on dark backgrounds.
- `space-background`: the backdrop palette is neutral deep-space with a denser starfield.
- `settings`: gains an **Exit** control (Android/web).

## Impact

- **Code:** `App.jsx` (mount the tab bar, map tabs ↔ the existing `screen` state — no router); `components/BottomTabBar.jsx` (new), `HomeScreen.jsx` (dashboard), `SettingsScreen.jsx` (Exit), `SpaceBackground.jsx` (density), `constants/theme.js` (neutral palette); `context/deckStats.js` (`globalStats` + `rankDecks`); `icons/` (`HomeIcon`, `PowerIcon` new; `DeckIcon`/`GearIcon` refined); custom icon art in `assets/*` + `public/favicon.ico`; `app.json` (name + dark backgrounds).
- **Tests:** new pure-module coverage — `globalStats` + `rankDecks` (Node test runner).
- **Dependencies / data:** none added; no migration.
- **Verification:** web (portrait + landscape) via DOM measurement. Native (tab-bar safe-area, Android back, launcher icon/splash) is a manual device pass.
