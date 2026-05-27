## 1. Dependencies and constants

- [x] 1.1 Install `expo-haptics` (Expo SDK 52 compatible — `npx expo install expo-haptics`) and update `package.json` + `package-lock.json`.
- [x] 1.2 Update `constants/settings.js`: drop `LIFE_MODES`; rename `STARTING_LIFE_MIN` to `INITIAL_LIFE_MIN = 0` (note: lower bound moves from 1 to 0); rename `STARTING_LIFE_MAX` to `INITIAL_LIFE_MAX = 99`; keep `STARTING_LIFE_PRESETS` (rename to `INITIAL_LIFE_PRESETS = [20, 25, 30, 40]` if convenient — same values either way); expand `DEFAULT_SETTINGS` to `{ player1Color: "green", player2Color: "red", initialLife: 30, enableAnimations: true, enableHaptics: false }`.
- [x] 1.3 Confirm `constants/teamColorKeys.js` is unchanged; the `npm test` suite should pass after step 1.2 once sanitize is updated.

## 2. Sanitize + migration

- [x] 2.1 Update `context/sanitize.js`: drop the `lifeMode` validation block from the output; add `initialLife` validation against `[0, 99]`; add boolean validation for `enableAnimations` and `enableHaptics`.
- [x] 2.2 Implement the migration logic in `sanitize`:
  1. Use `raw.initialLife` if valid (integer in `[0, 99]`).
  2. Else if `raw.lifeMode === "up"`, set `initialLife = 0`.
  3. Else if `raw.startingLife` is valid (integer in `[0, 99]`), copy it to `initialLife`.
  4. Else default to `30`.
- [x] 2.3 Update `__tests__/sanitize.test.js`: drop the `lifeMode` cases; rename `startingLife` test names to `initialLife`; broaden the boundary tests to include 0 (now valid); add cases for the migration paths in 2.2 (legacy down-mode + value, legacy up-mode → 0, no legacy at all → 30); add cases for `enableAnimations` and `enableHaptics` (valid bool, invalid type, missing).

## 3. Life math simplification

- [x] 3.1 Update `components/lifeMath.js`: collapse `LIFE_MIN_DOWN` / `LIFE_MIN_UP` into a single exported `LIFE_MIN = -9`; remove the `lifeMode` parameter from `canUpdateLife`, `clampLife`, and `getLifeMin` (latter becomes a constant — or delete and have callers use `LIFE_MIN`).
- [x] 3.2 Update `__tests__/lifeMath.test.js`: drop per-mode test pairs; update signatures; add a regression test that "starting at 0 and tapping − ten times lands at -9 and stops" (per the new spec scenario).
- [x] 3.3 Update callers (`PlayerView.jsx`) to use the new signatures; remove the `lifeMode` prop from `<PlayerView>` since life math no longer needs it.

## 4. Settings screen refactor

- [x] 4.1 Remove the entire **Life Mode** section from `components/SettingsScreen.jsx` — including the `LifeModeSelector` component and the conditional rendering around the stepper.
- [x] 4.2 Rename the section header to **Initial Life Points**; ensure the stepper is always rendered (no mode conditional); use the new `initialLife` setting key + `updateSettings({initialLife})`.
- [x] 4.3 Add a numeric `TextInput` above the stepper. Use a local `draft` value in component state to avoid committing on every keystroke. Commit on blur or on `onSubmitEditing`; parse as integer; if in `[0, 99]` call `updateSettings({initialLife: parsed})`, otherwise revert the input to the persisted value and show inline text "0–99 only" for ~2 seconds.
- [x] 4.4 Update the stepper bounds: the `−` button is disabled (or no-ops) at `0` instead of `1`; the `+` button still disables at `99`.
- [x] 4.5 Keep the static quick-pick chips (20, 25, 30, 40) — same behavior as today.
- [x] 4.6 Add an **Animations** section with a single labeled toggle bound to `settings.enableAnimations`.
- [x] 4.7 Add a **Haptic feedback** section with a single labeled toggle bound to `settings.enableHaptics`. Wrap the entire section in `Platform.OS !== "web" && (...)` so it's hidden on web.
- [x] 4.8 Build a small reusable `<SettingToggle>` component for the two new toggle rows (label on the left, switch on the right) so styling stays consistent.

## 5. PlayerView integration

- [x] 5.1 Update `components/PlayerView.jsx`: drop the `lifeMode` prop; accept new props `enableAnimations`, `enableHaptics`.
- [x] 5.2 Gate the existing life-change overlay animations on `enableAnimations` — when `false`, change the `Animated.timing` durations to `0` (overlay still appears for feedback, but snaps in and out).
- [x] 5.3 On every `+` / `−` press, call `Haptics.selectionAsync()` from `expo-haptics` if `enableHaptics` is true AND `Platform.OS !== "web"`. Import is fine at the top of the module (`expo-haptics` has a web no-op bundle, but we still gate the call to keep behavior explicit and avoid touching the web bundle path).

## 6. LifeCounter integration

- [x] 6.1 Update `components/LifeCounter.jsx`: replace `startConfig.lifeMode` and `startConfig.startingLife` with `startConfig.initialLife`; add `startConfig.enableAnimations` and `startConfig.enableHaptics` to the snapshot.
- [x] 6.2 Pass the new fields to both `<PlayerView>` instances. Drop the now-removed `lifeMode` prop.

## 7. InitiativeView animation gating

- [x] 7.1 Update `components/InitiativeView.jsx` to accept an `enableAnimations` prop. When `false`, replace the `Animated.sequence` durations with `0` so the opacity transition is instantaneous (no scale/shine).
- [x] 7.2 Thread `enableAnimations` through `PlayerView` → `InitiativeView`.

## 8. Documentation

- [x] 8.1 Update `README.md` to replace the Count Up/Down language with the new "Initial Life Points (0–99, typeable)" description; mention the new Animations and Haptic feedback toggles.

## 9. Manual verification (web)

- [x] 9.1 Cold launch in the browser: confirm Settings shows **Initial Life Points** (with typed input + stepper + presets), **Animations**, and **Team Colors** — and does **NOT** show Life Mode or (on web) Haptic feedback.
- [x] 9.2 Initial Life Points: verify the stepper at 0 disables `−`; verify the stepper at 99 disables `+`; verify typing `42` commits; verify typing `100` reverts with the inline message; verify typing `0` commits and a new game starts at 0/0; verify tapping a preset chip still sets the value.
- [x] 9.3 Disable Animations, start a game, tap +/- on life — verify the overlay appears but does not fade; verify the initiative claim transitions instantly without the shine.
- [x] 9.4 Confirm legacy settings migrate: in DevTools, set `localStorage["@swu-life-counter:settings"] = JSON.stringify({lifeMode: "up", startingLife: 25, player1Color: "red", player2Color: "blue"})` and reload. Expect `initialLife = 0` (because of the up-mode migration), no `lifeMode` in subsequent saves, and the new keys (`enableAnimations`, `enableHaptics`) at their defaults.
- [x] 9.5 Same migration test for `{lifeMode: "down", startingLife: 40}` — expect `initialLife = 40`.

## 10. Archival

- [x] 10.1 Verify `openspec status --change extend-settings --json` reports all artifacts done.
- [ ] 10.2 Run `/opsx:archive extend-settings` to move the change into `openspec/changes/archive/` and promote the delta spec to the existing `openspec/specs/settings/` capability (applying the REMOVED + MODIFIED + ADDED deltas).
