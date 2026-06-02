// Pure animation-policy helpers (React-free, dependency-free) so the gating
// logic can be exercised by Node's test runner (`npm test`) without the Metro
// bundler / react-native.
//
// The app keeps ONE animation code path: it always issues the same
// `Animated.timing` calls, but when the user turns animations OFF the duration
// is forced to 0 so the transition snaps instantly — feedback is preserved,
// motion is removed. These helpers centralize that decision so every component
// (and the tests) agree.

// Resolve an animation duration honoring the global "Enable animations"
// (reduce-motion) preference:
//   - `enableAnimations === false` → 0  (instant / no motion)
//   - anything else (true, or an unset/undefined value) → the base duration
// Defaulting an unset value to ON matches the components' `= true` prop
// defaults and the sanitized settings default.
export function animatedDuration(baseMs, enableAnimations) {
  return enableAnimations === false ? 0 : baseMs;
}

// Whether the shared space backdrop should ANIMATE (its drifting starfield).
// It moves only when BOTH the dedicated "Animated background" toggle AND the
// global "Enable animations" preference are on; otherwise the identical stars
// render statically. Missing/partial/garbage settings default to ON (so legacy
// blobs that predate `animatedBackground` still animate).
export function shouldAnimateBackground(settings) {
  if (!settings || typeof settings !== "object") return true;
  return settings.animatedBackground !== false && settings.enableAnimations !== false;
}
