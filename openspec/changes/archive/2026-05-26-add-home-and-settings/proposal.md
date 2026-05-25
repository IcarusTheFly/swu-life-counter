## Why

The app drops the user straight into a game with hardcoded team colors (red/green) and a fixed starting life of 30 counting downward. SWU players actually play several formats and group preferences vary — some play "to-the-death" counting down from 30, others track damage counting up from 0, and color preferences differ across playgroups. Surfacing these as user-configurable options behind a home screen makes the app usable for more groups without forcing a code change for each preference.

## What Changes

- Add a **Home screen** as the new app entry point with three options: **Start Game**, **Settings**, **Exit**.
- **Start Game** launches the existing two-player life counter (current `LifeCounter` flow, unchanged in mechanics).
- **Exit** closes the app on Android (`BackHandler.exitApp()`); on iOS, where programmatic exit is not permitted, the option is hidden so we never ship a button that doesn't work.
- Add a **Settings screen** reachable from Home with two controls:
  1. **Team colors** — pick one of at least 4 colors per side (player and opponent), replacing the hardcoded red/green press-feedback and reset-dialog button tints.
  2. **Life mode** — choose **Count Down** (default, start at a configurable value, default 30) or **Count Up** (start at 0). When Count Down is selected, the user can pick the starting value.
- **Persist settings** across app launches using `AsyncStorage` so a player only sets their preferences once.
- Settings take effect for the **next** game started from Home — changing settings mid-game does not retroactively reset an ongoing game (Settings is only reachable from Home, so this is naturally enforced).
- **BREAKING (internal)**: `LifeCounter` no longer hardcodes `30` or red/green; it accepts settings via props (or context). No persisted user data exists yet, so no data migration is needed.

## Capabilities

### New Capabilities
- `home-screen`: Top-level entry screen with navigation to game, settings, and exit.
- `settings`: User-configurable team colors and life-mode preferences, persisted across launches.

### Modified Capabilities
<!-- No existing specs in openspec/specs/ — the current LifeCounter has no documented spec. Behavioral changes to the game screen are captured under the new `settings` capability (which defines how settings drive game behavior) rather than as a delta to a nonexistent spec. -->

## Impact

- **New files**:
  - `components/HomeScreen.jsx` — three-option menu.
  - `components/SettingsScreen.jsx` — color and life-mode controls.
  - `components/MenuButton.jsx` — shared styled button for the home menu.
  - `context/SettingsContext.jsx` — provides settings + updater, handles `AsyncStorage` load/save.
  - `constants/teamColors.js` — the palette of selectable colors.
- **Modified files**:
  - `App.jsx` — owns the screen state machine (`"home" | "game" | "settings"`), wraps tree in `SettingsProvider`.
  - `components/LifeCounter.jsx` — reads starting life and per-side colors from settings; supports count-up mode (no upper clamp at 99 needed differently — see design); accepts a "back to home" callback.
  - `components/PlayerView.jsx` — accepts a `teamColor` prop and derives press-feedback tint from it.
  - `components/ConfirmationModal.jsx` — generalized title/button labels so it can serve both the in-game reset and a "Return to home?" confirmation; button colors driven by props (no more hardcoded `#8B0000`/`#4B79A1`).
- **New dependency**: `@react-native-async-storage/async-storage` (Expo-supported, peer of Expo SDK 52).
- **No new navigation library** — the app has 3 screens with no deep linking needs; a simple state-driven switch in `App.jsx` keeps the dependency surface small. See [design.md](design.md) for the trade-off discussion.
- **Platform**: Exit option is Android-only; iOS hides it (Apple HIG forbids programmatic exit).
- **No backend, no analytics, no migrations**.
