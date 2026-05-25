## 1. Dependencies and constants

- [x] 1.1 Install `@react-native-async-storage/async-storage` (Expo SDK 52 compatible version) and update `package.json` + `package-lock.json`.
- [x] 1.2 Create `constants/teamColors.js` exporting `TEAM_COLORS` (red, green, blue, yellow, purple, orange — each with `name`, `base` hex, and `press` 40%-alpha hex) and `TEAM_COLOR_KEYS` (stable insertion order).
- [x] 1.3 Create `constants/settings.js` exporting `DEFAULT_SETTINGS` (`{ player1Color: "green", player2Color: "red", lifeMode: "down", startingLife: 30 }`) and `SETTINGS_STORAGE_KEY = "@swu-life-counter:settings"`.

## 2. Settings context and persistence

- [x] 2.1 Create `context/SettingsContext.jsx` exporting `SettingsProvider` and `useSettings()` hook.
- [x] 2.2 In `SettingsProvider`, on mount: read `SETTINGS_STORAGE_KEY` from AsyncStorage, merge with `DEFAULT_SETTINGS` (defaults fill any missing keys to remain forward-compatible), set state, mark hydrated.
- [x] 2.3 While not hydrated, `SettingsProvider` renders `null` (matches the existing font-loading gate in `App.jsx`).
- [x] 2.4 Expose `updateSettings(partial)` that merges, sets state, and writes-through to AsyncStorage. Wrap the write in try/catch; log a warning on failure and do not throw.
- [x] 2.5 Guard against invalid persisted values: unknown color keys fall back to defaults; `lifeMode` not in `{"down","up"}` falls back to `"down"`; `startingLife` not in `[1, 99]` falls back to `30`.

## 3. Shared UI primitives

- [x] 3.1 Create `components/MenuButton.jsx` — a pressable pill button using the silver gradient `["#3c3c3c", "#6e6e6e", "#a1a1a1", "#6e6e6e", "#3c3c3c"]`, `FiraCode_700Bold` label, ≥44pt height, full-width with horizontal padding. Props: `label`, `onPress`, `accessibilityLabel` (optional, defaults to label).
- [x] 3.2 Generalize `components/ConfirmationModal.jsx`: accept `title: string` and `actions: Array<{ label, onPress, variant?: "destructive" | "primary" | "neutral" }>`. Define internal variant→color mapping (e.g., destructive: `#8B0000`, primary: `#4B79A1`, neutral: `#555`). Keep existing visual style (gradient backdrop, white text). Update all existing call sites in the same commit.
- [x] 3.3 Create `icons/BackIcon.jsx` (or add to existing icons dir) — chevron-left SVG using `react-native-svg`, stroke configurable, sized for a 44pt tap target wrapper.

## 4. Home screen

- [x] 4.1 Create `components/HomeScreen.jsx`. Props: `onStartGame`, `onOpenSettings`. Layout: black background, app title "SWU Life Counter" near the top using `FiraCode_700Bold`, three (Android) or two (iOS) `MenuButton`s vertically centered.
- [x] 4.2 In `HomeScreen`, conditionally render the **Exit** button only when `Platform.OS === "android"`. The Exit handler calls `BackHandler.exitApp()`.
- [x] 4.3 Ensure `HomeScreen` lays out correctly in both portrait and landscape (centered single column with `maxWidth` cap so buttons don't stretch absurdly wide on tablets/landscape).

## 5. Settings screen

- [x] 5.1 Create `components/SettingsScreen.jsx`. Props: `onBack`. Header row: back chevron (left) + "Settings" title.
- [x] 5.2 Build the **Team Colors** section. Two labeled rows ("Player", "Opponent"). Each row: horizontally scrollable (or wrapping if it fits) palette of color circles (≥44pt). Selected swatch shows a 3pt white ring. Tapping a swatch calls `updateSettings({ player1Color: key })` or `{ player2Color: key }`.
- [x] 5.3 Build the **Life Mode** section. Two-button segmented control: "Count Down" / "Count Up". Selected button visually distinct (filled vs. outlined). Tapping calls `updateSettings({ lifeMode })`.
- [x] 5.4 Build the **Starting Life** stepper, visible only when `lifeMode === "down"`. Layout: large numeric display centered, `−` and `+` buttons flanking it (clamped 1–99), and a row of quick-pick preset chips for 20, 25, 30, 40 below. All controls call `updateSettings({ startingLife })`.
- [x] 5.5 Tapping the back chevron calls `onBack` (settings are already persisted at the moment of each change — no explicit save action).
- [x] 5.6 Ensure the Settings screen scrolls (`ScrollView`) if content exceeds viewport in landscape on small phones.

## 6. App-level navigation and integration

- [x] 6.1 In `App.jsx`, wrap the existing tree in `<SettingsProvider>` (inside the font-load gate so we already know fonts are ready, or in parallel — pick one and stick to it; recommend wrapping outside so settings load alongside fonts).
- [x] 6.2 Add a `screen` state in `App.jsx` (`"home" | "game" | "settings"`), defaulting to `"home"`. Render `HomeScreen`, `LifeCounter`, or `SettingsScreen` based on it.
- [x] 6.3 Wire `HomeScreen` callbacks: `onStartGame` → set screen to `"game"`; `onOpenSettings` → set screen to `"settings"`.
- [x] 6.4 Wire `SettingsScreen.onBack` → set screen to `"home"`.
- [x] 6.5 Wire `LifeCounter`'s new `onReturnHome` prop → set screen to `"home"`.

## 7. Life counter changes

- [x] 7.1 In `LifeCounter.jsx`, replace hardcoded `30` with values derived from settings. Accept settings via `useSettings()` hook (read once at mount and snapshot into local state, or pass as props from `App.jsx`). Use `startingLife` for Count Down mode; use `0` for Count Up mode.
- [x] 7.2 Pass `teamColor` (the resolved palette entry) to each `PlayerView`. Pass `lifeMode` so `PlayerView` can apply the per-mode lower clamp.
- [x] 7.3 Update `LifeCounter`'s `resetApp` to reset to the snapshotted starting values (not always 30).
- [x] 7.4 Wire the existing reset icon to open a `ConfirmationModal` with three actions: "Reset Life" (destructive), "Return to Home" (primary), "Cancel" (neutral). "Return to Home" calls `onReturnHome` (passed in from `App.jsx`).
- [x] 7.5 In `PlayerView.jsx`, replace hardcoded `#FF634766` / `#42FF8466` with `teamColor.press`. Pass through `isOpponent` so the existing rotation/style logic is unchanged.
- [x] 7.6 In `PlayerView.jsx`'s `updateLife`, adjust the lower clamp: `lifeMode === "up"` → minimum is `0`; otherwise minimum is `-9` (existing behavior). Upper clamp stays at `99`.

## 8. Android hardware back button

- [x] 8.1 In `LifeCounter.jsx`, register a `BackHandler` listener on mount that calls `onReturnHome` and returns `true` (consumes the event). Clean up on unmount.
- [x] 8.2 In `SettingsScreen.jsx`, register a `BackHandler` listener on mount that calls `onBack` and returns `true`. Clean up on unmount.
- [x] 8.3 Do **not** register a listener on `HomeScreen` (default OS behavior of background/exit is desired).

## 9. Manual verification

- [x] 9.1 **Web smoke (verified)** — cold launch in browser shows Home with three buttons; Start Game → 30/30 counter with green/red press tints; reset modal shows three actions; Return to Home works; Exit closes the tab.
- [x] 9.3 **Web smoke (verified)** — Settings flow: changed Player to blue, Opponent to orange, lifeMode to Count Up; returned to Home; started a game; counter started at 0/0 with blue/orange press tints; "−" did not drop below 0.
- [x] 9.4 **Web smoke (verified)** — persistence survives a page reload (AsyncStorage-on-web uses localStorage); a re-launched game uses the persisted values.
- [x] 9.5 **Web smoke (verified)** — stepper clamps at 1/99, presets set values directly, stepper hides in Count Up.
- [x] 9.6 **Web smoke (verified)** — resizing the browser window into a landscape-ish ratio swaps the per-side backgrounds to the `_landscape` variants and the game-side opponent rotation still works.
- [ ] 9.2 **Deferred (native)** — iOS simulator: Home shows only two buttons (no Exit). All other flows behave as on Android. *Pushed to a later native verification pass.*
- [ ] 9.7 **Deferred (native)** — Android hardware back: from Settings → Home; from Game → Home; from Home → app exits/backgrounds. *Pushed to a later native verification pass.*

## 10. Color-variant asset pipeline (resolves Open Question #3)

- [x] 10.1 Author `scripts/generate_color_variants.py` (Pillow + NumPy): hue-rotates a hand-authored `assets/bg_separated_lines.png` to every color in `COLORS`, with saturation scaled proportionally to each target's own saturation (so pastels stay pastel, white desaturates to silver), and overlays a small Gaussian glow.
- [x] 10.2 Add a landscape pass: derive `lines_on_white` + `clean_space_bg` from `assets/bg-space-opponent-landscape.png` via "redness extraction" (`R - mean(G,B)`), then run the same recolor pipeline at landscape size.
- [x] 10.3 Extend `COLORS` to 8 (red, orange, yellow, green, blue, purple, pink, white). Verify the pipeline handles soft/pastel targets and pure-white correctly.
- [x] 10.4 Emit `assets/bg_complete_<color>{,_landscape}.png` (16 files) plus `assets/bg_separated_lines_<color>{,_landscape}.png` (16 transparent-BG variants for diagnostics).
- [x] 10.5 Stand up a static-server preview at `openspec/changes/add-home-and-settings/mockup/colors/index.html` and add it as `colors-preview` in `.claude/launch.json`.

## 11. Wire color-variant assets into the app

- [x] 11.1 Update `constants/teamColors.js` to (a) sync hex values to the pipeline inputs, (b) add `pink` and `white` entries, and (c) embed static `require()`s for `bg.portrait` and `bg.landscape` per color (React Native requires literal paths).
- [x] 11.2 Update `components/LifeCounter.jsx` to source the player background from `startConfig.playerNColor.bg.{portrait, landscape}` instead of the hardcoded `bg-space-*.png` requires. Verify the snapshot-at-mount behavior still freezes the chosen colors for the game's lifetime.
- [x] 11.3 Verify `SettingsScreen.jsx`'s color picker auto-renders pink + white via `TEAM_COLOR_KEYS` (no code change required).
- [x] 11.4 Verify `SettingsContext.sanitize()` accepts pink + white (no code change — it validates against `TEAM_COLOR_KEYS`).

## 12. Web warnings + test scaffolding

- [x] 12.1 Audit and fix React Native Web warnings: gate `expo-navigation-bar`'s `setVisibilityAsync` on Android in `ScreenLayout.jsx`; move `resizeMode` from a style entry to an `<Image>` prop in `InitiativeView.jsx`; gate `useNativeDriver` on `Platform.OS !== "web"` in `PlayerView.jsx` + `InitiativeView.jsx`.
- [x] 12.2 Fix the `"textShadow*"` deprecation properly via `utils/textShadow.js` — a cross-platform helper that returns the CSS-style `textShadow` shorthand on web (no warning) and the longhand trio on native (still required by RN 0.76). Applied across `HomeScreen`, `MenuButton`, `SettingsScreen`, `ConfirmationModal`, and `PlayerView`; while there, removed the bogus `textShadowOpacity` prop from `PlayerView` text styles (not a valid RN style key — folded the opacity into the rgba color).
- [x] 12.2b Fix `Uncaught NotAllowedError: Failed to execute 'request' on 'WakeLock'` on web. `expo-keep-awake`'s `useKeepAwake()` requested a wake-lock on mount even when the document wasn't yet visible; now wrapped in a `<KeepAwakeOnNative />` child component that's only rendered when `Platform.OS !== "web"`. Desktop browsers don't need a wake lock anyway.
- [x] 12.3 Extract pure logic into testable modules: `context/sanitize.js` (settings sanitizer), `constants/teamColorKeys.js` (pure-JS key list), `components/lifeMath.js` (life clamping math). Update consumers (`SettingsContext.jsx`, `teamColors.js`, `PlayerView.jsx`) accordingly; no behavior change.
- [x] 12.4 Add a Node-based test suite under `__tests__/` covering `sanitize`, `lifeMath`, and asset presence per team color. Run with `npm test` — uses Node's built-in test runner, no Jest/RTL install.
- [x] 12.5 Add a GitHub Actions workflow at `.github/workflows/test.yml` that runs `npm test` on every push and PR so the suite doesn't quietly rot.

## 13. Cleanup and archival

- [x] 13.1 Remove any now-unused imports/constants (e.g., the old hardcoded press-tint hex literals in `PlayerView.jsx`).
- [x] 13.2 Update `README.md` to mention the Home screen and settings (one paragraph) AND point at `scripts/generate_color_variants.md` so future-you knows where the tuning knobs live.
- [ ] 13.3 Smoke-test once more on Android and iOS (tasks 9.2 + 9.7), then run `/opsx:archive` for `add-home-and-settings` to move the change into `openspec/changes/archive/` and promote the specs to `openspec/specs/`.
