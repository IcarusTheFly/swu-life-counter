export const SETTINGS_STORAGE_KEY = "@swu-life-counter:settings";

export const DEFAULT_SETTINGS = {
  player1Color: "green",
  player2Color: "red",
  initialLife: 30,
  enableAnimations: true,
  enableHaptics: false
};

// Initial Life Points input range. Lower bound is 0 so "count up from 0" is a
// directly-pickable value (the legacy Count Up mode is gone — see the
// archived change `extend-settings` for the migration rationale).
export const INITIAL_LIFE_MIN = 0;
export const INITIAL_LIFE_MAX = 99;

// Static quick-pick presets shown beneath the stepper. Tapping a chip sets
// the value. The list itself is intentionally NOT user-editable — keeping it
// static avoids a maintenance burden for low real-world value.
export const INITIAL_LIFE_PRESETS = [20, 25, 30, 40];
