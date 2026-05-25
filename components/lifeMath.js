// Pure life-counter math, extracted from PlayerView so it can be unit-tested
// without React Native. Keep this file free of React imports.

export const LIFE_MAX = 99;
export const LIFE_MIN_DOWN = -9;
export const LIFE_MIN_UP = 0;

/**
 * Per-mode minimum life value.
 *  - "down" mode allows negative life (existing behavior; players use it for
 *    extra-deep losses).
 *  - "up" mode is a damage counter; going below zero is meaningless.
 */
export function getLifeMin(lifeMode) {
  return lifeMode === "up" ? LIFE_MIN_UP : LIFE_MIN_DOWN;
}

/**
 * Predicate for whether a +/− tap should actually move the counter.
 * Returns false at the clamp boundary in the requested direction.
 */
export function canUpdateLife(currentLife, change, lifeMode) {
  if (change > 0) return currentLife < LIFE_MAX;
  if (change < 0) return currentLife > getLifeMin(lifeMode);
  return false;
}

/** Clamp a raw life value to the legal range for the given mode. */
export function clampLife(life, lifeMode) {
  const min = getLifeMin(lifeMode);
  if (life > LIFE_MAX) return LIFE_MAX;
  if (life < min) return min;
  return life;
}
