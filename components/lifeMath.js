// Pure life-counter math, extracted from PlayerView so it can be unit-tested
// without React Native. Keep this file free of React imports.
//
// History: the original `add-home-and-settings` change introduced separate
// `LIFE_MIN_DOWN = -9` and `LIFE_MIN_UP = 0` constants paired with a
// `lifeMode` parameter on every helper. The `extend-settings` change
// collapsed Count Up / Count Down into a single Initial Life Points number
// and fixed the lower clamp at -9 globally — so the per-mode logic is gone.

export const LIFE_MAX = 99;
export const LIFE_MIN = -9;

/**
 * Predicate for whether a +/− tap should actually move the counter.
 * Returns false at the clamp boundary in the requested direction.
 */
export function canUpdateLife(currentLife, change) {
  if (change > 0) return currentLife < LIFE_MAX;
  if (change < 0) return currentLife > LIFE_MIN;
  return false;
}

/** Clamp a raw life value to the legal range. */
export function clampLife(life) {
  if (life > LIFE_MAX) return LIFE_MAX;
  if (life < LIFE_MIN) return LIFE_MIN;
  return life;
}
