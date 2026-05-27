// Pure helper: validate persisted settings and merge with defaults.
//
// Extracted from SettingsContext.jsx so it can be exercised by `node --test`
// without pulling in React Native, AsyncStorage, or JSX. Keep this file free
// of React imports.

// Explicit `.js` extensions on the imports below so this module loads under
// Node ESM (used by the `npm test` runner) as well as Metro (which accepts
// either form).
import {DEFAULT_SETTINGS, INITIAL_LIFE_MAX, INITIAL_LIFE_MIN} from "../constants/settings.js";
import {TEAM_COLOR_KEYS} from "../constants/teamColorKeys.js";

function isValidInitialLife(n) {
  return Number.isInteger(n) && n >= INITIAL_LIFE_MIN && n <= INITIAL_LIFE_MAX;
}

// Resolve `initialLife` honoring three legacy persistence shapes:
//   1. New shape — `initialLife` is set and valid → use it.
//   2. Legacy Count Up — `lifeMode === "up"` → games used to start at 0 → use 0.
//   3. Legacy Count Down — `startingLife` valid → use it.
//   4. Otherwise → default.
function resolveInitialLife(raw) {
  if (isValidInitialLife(raw.initialLife)) return raw.initialLife;
  if (raw.lifeMode === "up") return 0;
  if (isValidInitialLife(raw.startingLife)) return raw.startingLife;
  return DEFAULT_SETTINGS.initialLife;
}

export function sanitize(raw) {
  const next = {...DEFAULT_SETTINGS};
  if (raw && typeof raw === "object") {
    if (TEAM_COLOR_KEYS.includes(raw.player1Color)) next.player1Color = raw.player1Color;
    if (TEAM_COLOR_KEYS.includes(raw.player2Color)) next.player2Color = raw.player2Color;
    next.initialLife = resolveInitialLife(raw);
    if (typeof raw.enableAnimations === "boolean") next.enableAnimations = raw.enableAnimations;
    if (typeof raw.enableHaptics === "boolean") next.enableHaptics = raw.enableHaptics;
  }
  return next;
}
