## Why

The current Settings screen carries a vestigial **Count Down / Count Up** toggle that conflates two ideas — *where the counter starts* and *which direction is "good"* — into a single setting that needs explanation. Players already understand "what does life start at?" so we can collapse the toggle into a single **Initial life points** number and remove a UI layer.

While the Settings menu is open for revision, two small UX preferences (animations off, haptic feedback) would meaningfully improve the experience for repeat users.

A resource counter was considered and rejected: SWU resources are physical face-down cards visible at the table (count = row size; ready vs exhausted = card orientation), so an in-app counter would duplicate state that's already there. See `design.md` Decision 4 for the full rationale.

## What Changes

**Life-mode simplification (BREAKING — persisted shape):**
- **BREAKING**: Remove the `lifeMode` setting entirely. The Settings screen no longer shows a Count Up / Count Down toggle.
- Replace "Starting Life" with **Initial life points** — a single value used at every game start.
- **Allow direct numeric input**: the user can type the Initial life points value via a `TextInput` (numeric keyboard), as well as use the existing `+/−` stepper. Range is **0–99** (lower bound moves from 1 to 0 so "count up from 0" is a directly-pickable value).
- The in-game lower clamp is **always -9** (preserving the historical Count Down floor). The "damage counter can't go negative" affordance from Count Up mode is removed — players who start at 0 can tick down past 0 like any other start value.
- Migration: persisted `lifeMode: "up"` settings map to `initialLife: 0` (preserving the up-mode behavior); `lifeMode: "down"` settings keep their persisted `startingLife` value as `initialLife`; the `lifeMode` key is no longer written.

**New Settings additions:**
- **Animations toggle** — disables the life-change fade overlay and the initiative shine animation for users who want a snappier or lower-motion experience. Default **on**.
- **Haptic feedback toggle** — on mobile (iOS Taptic Engine via `expo-haptics`, Android vibrator), triggers a brief tap on each +/− press. Default **off**; the entire section is hidden on web where the platform has no haptic API.

**Cleanup in passing:**
- Simplify `components/lifeMath.js`: remove the `lifeMode` parameter from `canUpdateLife`, `clampLife`, and `getLifeMin`. The minimum is now a single constant (`-9`).
- The hardcoded quick-pick chips (20/25/30/40) stay as static convenience under the new typed input — they were never controversial.
- Update existing tests to match the simplified life-math API; add tests for the new sanitize migration path (`lifeMode` → `initialLife` conversion).

## Capabilities

### New Capabilities
None — this change is entirely about modifying the existing `settings` capability and trimming `lifeMath`.

### Modified Capabilities
- `settings`: removes the Count Up / Count Down requirement and the per-mode life clamp requirement; renames the starting-life UI to **Initial life points**; broadens the range to `[0, 99]`; adds a typed numeric input alongside the stepper; adds new requirements for the animations toggle and the mobile-only haptic feedback toggle.

## Impact

**Code:**
- `constants/settings.js`: drop `LIFE_MODES`; rename `STARTING_LIFE_*` to `INITIAL_LIFE_*` with `INITIAL_LIFE_MIN = 0` and `INITIAL_LIFE_MAX = 99`; expand `DEFAULT_SETTINGS` to `{ player1Color: "green", player2Color: "red", initialLife: 30, enableAnimations: true, enableHaptics: false }`. The quick-pick presets stay hardcoded at `[20, 25, 30, 40]`.
- `context/sanitize.js`: drop `lifeMode` handling (but read it during migration); validate `initialLife` against `[0, 99]`; add validation for `enableAnimations` and `enableHaptics` (both booleans).
- `components/lifeMath.js`: remove the `lifeMode` parameter; constants `LIFE_MIN_DOWN` / `LIFE_MIN_UP` collapse to a single `LIFE_MIN = -9`.
- `components/PlayerView.jsx`: drop the `lifeMode` prop; accept new props `enableAnimations`, `enableHaptics`; gate animation calls on `enableAnimations`; call `Haptics.selectionAsync()` (guarded on `Platform.OS !== "web"`) when `enableHaptics` is true.
- `components/LifeCounter.jsx`: snapshot the new settings at mount; remove `lifeMode` from `startConfig`; pass `enableAnimations` and `enableHaptics` to `PlayerView`.
- `components/SettingsScreen.jsx`: remove the Life Mode segmented control and the conditional rendering around the stepper; rename the section to **Initial life points**; add a `TextInput` (numeric, validated) above the stepper; range now allows 0; add new sections — **Animations** (toggle) and **Haptic feedback** (toggle, hidden on web).
- `components/InitiativeView.jsx`: accept `enableAnimations` and gate the claim-shine animation.
- `__tests__/lifeMath.test.js`: simplify — drop per-mode test pairs.
- `__tests__/sanitize.test.js`: drop `lifeMode` cases; add cases for `initialLife` validation at 0, 99, and migration from legacy `lifeMode: "up"` → `initialLife: 0` and `lifeMode: "down" + startingLife: N` → `initialLife: N`.

**Dependencies:**
- Add `expo-haptics` to `package.json` (Expo SDK 52 compatible). Web is a no-op; we still platform-guard the call.

**Specs:**
- Delta `openspec/changes/extend-settings/specs/settings/spec.md` with `## REMOVED`, `## MODIFIED`, and `## ADDED` sections against the archived settings spec at `openspec/specs/settings/spec.md`.
