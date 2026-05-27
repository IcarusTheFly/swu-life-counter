// Tests for the life-counter clamping math used by PlayerView.
//
// PlayerView calls `canUpdateLife()` to decide whether a +/− tap should be a
// no-op (at boundary) or apply. These tests pin down the fixed-range clamps
// so a future refactor can't silently change the boundaries.

import test from "node:test";
import assert from "node:assert/strict";

import {LIFE_MAX, LIFE_MIN, canUpdateLife, clampLife} from "../components/lifeMath.js";

test("LIFE_MIN is -9 and LIFE_MAX is 99 (preserves the legacy Count Down floor)", () => {
  assert.equal(LIFE_MIN, -9);
  assert.equal(LIFE_MAX, 99);
});

test("canUpdateLife allows '+' when below max", () => {
  assert.equal(canUpdateLife(30, +1), true);
  assert.equal(canUpdateLife(0, +1), true);
  assert.equal(canUpdateLife(-5, +1), true);
});

test("canUpdateLife blocks '+' at the 99 ceiling", () => {
  assert.equal(canUpdateLife(LIFE_MAX, +1), false);
});

test("canUpdateLife allows '−' while above the floor", () => {
  assert.equal(canUpdateLife(0, -1), true); // 0 is above -9
  assert.equal(canUpdateLife(1, -1), true);
  assert.equal(canUpdateLife(-8, -1), true);
});

test("canUpdateLife blocks '−' at the -9 floor", () => {
  assert.equal(canUpdateLife(LIFE_MIN, -1), false);
});

test("canUpdateLife returns false for zero-magnitude change", () => {
  assert.equal(canUpdateLife(30, 0), false);
});

test("clampLife caps at 99", () => {
  assert.equal(clampLife(150), LIFE_MAX);
  assert.equal(clampLife(100), LIFE_MAX);
});

test("clampLife respects the -9 floor", () => {
  assert.equal(clampLife(-50), LIFE_MIN);
  assert.equal(clampLife(-10), LIFE_MIN);
});

test("clampLife is a no-op for values inside the legal range", () => {
  assert.equal(clampLife(30), 30);
  assert.equal(clampLife(0), 0);
  assert.equal(clampLife(50), 50);
  assert.equal(clampLife(-5), -5);
  assert.equal(clampLife(LIFE_MIN), LIFE_MIN);
  assert.equal(clampLife(LIFE_MAX), LIFE_MAX);
});

test("regression: starting at 0 and tapping − ten times lands at -9 and stops", () => {
  // This is the canonical scenario from the extend-settings spec:
  // the user picks Initial Life 0, then taps − until the floor.
  let life = 0;
  for (let i = 0; i < 10; i += 1) {
    if (canUpdateLife(life, -1)) life -= 1;
  }
  assert.equal(life, -9, "after 10 taps from 0, life should be -9 (9 valid + 1 blocked)");
  // One more tap is a no-op.
  if (canUpdateLife(life, -1)) life -= 1;
  assert.equal(life, -9);
});
