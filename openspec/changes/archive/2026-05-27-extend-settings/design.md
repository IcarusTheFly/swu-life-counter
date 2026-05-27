## Context

The archived `add-home-and-settings` change cut the original Settings screen with a Count Down / Count Up toggle plus a Starting Life stepper. That toggle has been a source of confusion since: players ask "what's the difference?" and the only answer is "the floor — Count Up can't go below zero." That's a thin behavioral difference dressed up as a major mode setting.

This change:
1. Collapses the life-mode toggle into a single **Initial life points** number.
2. Broadens the input range to `[0, 99]` and adds a typed-input affordance so users can set any starting value (including 0) directly.
3. Adds two small UX preference toggles (animations, mobile-only haptics) that mature the Settings screen toward something a regular player would tweak.

A resource counter was scoped in early drafts and explicitly removed (see Decision 4). The summary: SWU resources are physical face-down cards visible at the table, so app-level tracking would duplicate visible state.

## Goals / Non-Goals

**Goals:**
- Reduce Settings cognitive load by removing one section entirely (Life Mode) without losing functionality for users who want to "count up from 0" — they pick `0` directly in the new range.
- Allow typed numeric input so a power user can set, say, `42` in one keystroke instead of nine taps on `+`.
- Provide two opt-in UX preferences (animations, haptics) that improve the experience for repeat users without changing first-launch defaults.
- Migration of persisted settings is silent and behaviour-preserving: an existing `lifeMode: "up"` user gets `initialLife: 0`; an existing `lifeMode: "down"` user keeps their value.
- Maintain the existing test-runs-via-`npm test` pattern; add tests for the migration path.

**Non-Goals:**
- Resource counter (see Decision 4 below).
- Editable / user-customizable quick-pick presets — the existing `[20, 25, 30, 40]` chips stay as static convenience.
- Other settings brainstormed and deferred: round counter, hand-size tracker, damage history / undo, reset-confirmation toggle, quick-add `+5 / −5` buttons. All can land in future changes.
- Sound effects — separate feature.
- Migrating Count Down users to a different starting value — `startingLife` carries forward unchanged.

## Decisions

### Decision 1: Rename the persisted key `startingLife` → `initialLife`, with migration on read

`startingLife` was always paired with `lifeMode` — together they answered "where does life start?" Now that the mode is gone, the value alone answers it, and **Initial life points** is the user-facing label. Aligning the persisted key with the label reduces mental drift between code and product copy.

The migration lives in `context/sanitize.js`:
1. If `raw.initialLife` is a valid integer in `[0, 99]`, use it.
2. Else if `raw.lifeMode === "up"`, set `initialLife = 0` (preserves the prior Count Up behavior).
3. Else if `raw.startingLife` is a valid integer in `[0, 99]`, copy it to `initialLife` (preserves the prior Count Down behavior).
4. Else default to `30`.

The `lifeMode` key is never written by `updateSettings` after this change, so it fades out of persisted storage on the next save.

**Alternatives considered:**
- Keep `startingLife` as the persisted key. Cheaper, but leaves a permanent code/UI mismatch.
- Two-step migration write-back (read old key, write new key on next save). Extra complexity for no user-visible benefit; sanitize-on-read is enough.

### Decision 2: The lower clamp is always `-9` — no inferred-from-initial behavior

The user explicitly chose "Always -9" over the smart-inference option ("0 if initial is 0, else -9"). This means a game started at Initial Life = 0 can tick *down* to -9. That used to be impossible in Count Up mode; the "damage counter never goes negative" invariant is **dropped** by this change.

Why this is OK:
- The "-9" floor exists today for cosmic-damage edge cases in normal play. Players who reach negatives know what they're doing.
- A configurable "minimum life" setting would be a third knob in a section we're trying to shrink, not grow.

**Implementation simplification:** `getLifeMin(lifeMode)` and the per-mode constant pair in `lifeMath.js` collapse into a single exported `LIFE_MIN = -9`. The `canUpdateLife` and `clampLife` signatures drop the `lifeMode` parameter — callers (`PlayerView`) lose the prop entirely.

### Decision 3: `initialLife` range is `[0, 99]` and supports typed numeric input

Today `startingLife` is `[1, 99]` for Count Down. Count Up users effectively had `initial = 0` baked in. After this change, **`0` is a directly-pickable value in the stepper** — the lower bound moves from 1 to 0. This:
- Removes the "tap `−` once after the game starts" workaround proposed in earlier drafts.
- Keeps the typed-input UI honest — a user typing `0` gets exactly that.

The Initial Life Points section grows a `TextInput` (numeric keyboard) above the existing stepper:
- The input shows the current value.
- On blur or submit, the value is parsed as an integer; if it's in `[0, 99]` it's committed via `updateSettings({initialLife: parsed})`; otherwise the input reverts to the last valid value and shows a brief inline message ("0–99 only").
- The `+/−` stepper buttons stay and clamp to `[0, 99]`.
- The static quick-pick chips (20, 25, 30, 40) stay; tapping a chip sets the value.

**Alternatives considered:**
- TextInput-only (no stepper). Loses the one-tap +/- ergonomics that mobile users rely on.
- Stepper-only (no TextInput). Forces 30+ taps to go from 30 → 1, which is what motivated this whole feature.
- Slider. Overkill for a single integer in a small range.

### Decision 4: Resource counter is explicitly rejected (scope-down from earlier drafts)

The earliest draft of this proposal included a per-side Resource counter as a new capability. After re-reading the SWU comprehensive rules, this was dropped:

- Resources in SWU are physical face-down cards placed in front of each player.
- The *count* of resources is the visible size of that row.
- *Ready vs exhausted* is encoded in card orientation (vertical / horizontal).
- The only meaningful threshold ("7+ resources" for some leaders' Epic Action) is just as visible from the table.

An app counter would duplicate physical state. Worst case: a player forgets to tap `+1`, the app desyncs from reality, and they stop trusting the counter. Apps should track state that's *hidden* or *too volatile to track in your head* (life, dice rolls). Resources are neither.

If a future iteration adds a *Resources* feature, it should solve a real problem (e.g. tracking the 7+ threshold automatically by reading from a different state), not duplicate the visible card row.

### Decision 5: Animations toggle — gates both PlayerView fade and InitiativeView shine

`enableAnimations` (default `true`) is a single boolean that gates two existing animations:
1. `PlayerView`'s life-change overlay fade-in/fade-out (`Animated.timing` on `fadeAnim` and `translateYAnim`).
2. `InitiativeView`'s claim shine sequence.

When `false`, the relevant `Animated.timing` calls run with `duration: 0` so React still renders the final state. We pick **duration: 0** rather than skipping the overlay entirely because the "life change indicator" is functional feedback ("you tapped +1"), not just polish. Snapping the overlay in (then snapping out after the existing 2s window) preserves feedback while removing motion.

### Decision 6: Haptic feedback — `expo-haptics` with a `Platform.OS === "web"` early-return in Settings

`enableHaptics` (default `false`) controls whether `+/−` taps fire `Haptics.selectionAsync()` (a short, light tap suitable for repeated input — not the heavier `notificationAsync(Success/Warning/Error)`).

- On native (iOS/Android): the call hits `expo-haptics` and the device's haptic engine.
- On web: the entire Haptic feedback section is **hidden** in Settings (`Platform.OS === "web"` early-return), and `PlayerView` short-circuits before calling `expo-haptics`. The persisted value is preserved but inert.

**Why default `false`:** haptics are a personal preference; opt-in feels right.

### Decision 7: All new settings snapshot at game start, consistent with existing settings

Same pattern as `add-home-and-settings`: when `LifeCounter` mounts, `useMemo([])` snapshots the current settings into `startConfig`. Mid-game settings changes can't happen anyway (Settings is unreachable from Game), so this is functionally live-read but the explicit snapshot keeps `PlayerView` decoupled from the SettingsContext.

`startConfig` grows to include `enableAnimations` and `enableHaptics`. `lifeMode` is removed. `startingLife` is renamed to `initialLife`.

## Risks / Trade-offs

- **Count Up users see no functional regression because we migrate them to `initialLife: 0`** → but their typed-input experience is new. Mitigation: documented in the migration section; users who had Count Up see a game start at 0 just as before.
- **Typed input could be rejected silently** → if the user types `100`, the input reverts to the last valid value. Mitigation: a brief inline "0–99 only" message accompanies the revert. We considered a more elaborate validation toast but the inline copy is enough for a single-field form.
- **Stepper at 0 with `−` button** → the `−` button now disables at 0 (a new boundary case). Mitigation: the existing clamp-aware Pressable already handles this; the only change is the constant going from `1` to `0`.
- **Haptics on Android can feel inconsistent** → device vibrator behavior varies wildly. Mitigation: `selectionAsync()` is the standard short tap; users who don't like it turn it off.
- **`expo-haptics` adds a dependency** → marginal bundle/native config impact. Mitigation: it's an Expo-blessed module, no native config needed on managed workflows.
- **Animations toggle with `duration: 0`** → some users may expect "no overlay at all" rather than "instant overlay." Mitigation: the +/- still produces the same life-number change; the overlay is feedback, kept but de-motioned.

## Migration Plan

No data migration is forced. `SettingsContext.sanitize()` handles the schema transition on first read after the upgrade:

1. Load persisted JSON as before.
2. Resolve `initialLife`:
   - Use `raw.initialLife` if a valid integer in `[0, 99]`.
   - Else if `raw.lifeMode === "up"`, use `0`.
   - Else use `raw.startingLife` if valid.
   - Else `30`.
3. Drop `raw.lifeMode` entirely (don't read it after the migration check above).
4. For each new field (`enableAnimations`, `enableHaptics`), use the persisted value if valid (boolean), else the default.
5. The next call to `updateSettings` (or any setting change) writes back the new shape — `lifeMode` and `startingLife` are no longer emitted, and they fade out of persisted storage on the next save.

**Rollback:** revert the commits. The old code's sanitize falls back to defaults when keys are missing, so post-rollback users see `startingLife = 30` and `lifeMode = "down"` if they'd never set those — acceptable.

## Open Questions

- **Should the typed-input field accept partial values during typing?** E.g., typing `4` should not immediately commit `4` as `initialLife` if the user is about to type `45`. We'll commit on blur or on explicit submit (Done / Enter), not on every keystroke. Implementation: store a local `draft` value in component state, only call `updateSettings` on commit.
- **Should the `−` button at `0` show any feedback (toast / shake) or just be a silent no-op?** Leaning silent no-op — matches the existing `+` at 99 behavior, no need for new feedback patterns.
