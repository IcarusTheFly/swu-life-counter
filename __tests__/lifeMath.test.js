// Tests for the life-counter clamping math used by PlayerView.
//
// PlayerView calls `canUpdateLife()` to decide whether a +/− tap should be a
// no-op (at boundary) or apply. These tests pin down the per-mode clamps so a
// future refactor can't silently change the boundaries.

import test from "node:test";
import assert from "node:assert/strict";

import {
  LIFE_MAX,
  LIFE_MIN_DOWN,
  LIFE_MIN_UP,
  canUpdateLife,
  clampLife,
  getLifeMin
} from "../components/lifeMath.js";

test("getLifeMin returns 0 in 'up' mode (damage counter, no negatives)", () => {
  assert.equal(getLifeMin("up"), 0);
  assert.equal(getLifeMin("up"), LIFE_MIN_UP);
});

test("getLifeMin returns -9 in 'down' mode (existing behavior preserved)", () => {
  assert.equal(getLifeMin("down"), -9);
  assert.equal(getLifeMin("down"), LIFE_MIN_DOWN);
});

test("getLifeMin defaults to the 'down' clamp for unknown/missing modes", () => {
  assert.equal(getLifeMin(undefined), LIFE_MIN_DOWN);
  assert.equal(getLifeMin("sideways"), LIFE_MIN_DOWN);
});

test("canUpdateLife allows '+' when below max", () => {
  assert.equal(canUpdateLife(30, +1, "down"), true);
  assert.equal(canUpdateLife(0, +1, "up"), true);
});

test("canUpdateLife blocks '+' at the 99 ceiling in both modes", () => {
  assert.equal(canUpdateLife(LIFE_MAX, +1, "down"), false);
  assert.equal(canUpdateLife(LIFE_MAX, +1, "up"), false);
});

test("canUpdateLife allows '−' while above the per-mode min", () => {
  assert.equal(canUpdateLife(0, -1, "down"), true); // down-mode allows negatives
  assert.equal(canUpdateLife(1, -1, "up"), true);
});

test("canUpdateLife blocks '−' at the per-mode floor", () => {
  // Down mode: -9 is the floor.
  assert.equal(canUpdateLife(LIFE_MIN_DOWN, -1, "down"), false);
  // Up mode: 0 is the floor (no negative damage).
  assert.equal(canUpdateLife(LIFE_MIN_UP, -1, "up"), false);
});

test("canUpdateLife returns false for zero-magnitude change", () => {
  assert.equal(canUpdateLife(30, 0, "down"), false);
});

test("clampLife caps at 99 in both modes", () => {
  assert.equal(clampLife(150, "down"), LIFE_MAX);
  assert.equal(clampLife(150, "up"), LIFE_MAX);
});

test("clampLife respects per-mode floor", () => {
  assert.equal(clampLife(-50, "down"), LIFE_MIN_DOWN);
  assert.equal(clampLife(-50, "up"), LIFE_MIN_UP);
});

test("clampLife is a no-op for values inside the legal range", () => {
  assert.equal(clampLife(30, "down"), 30);
  assert.equal(clampLife(0, "up"), 0);
  assert.equal(clampLife(50, "up"), 50);
  assert.equal(clampLife(-5, "down"), -5);
});

test("regression: count-up mode cannot tick below zero (the 'damage counter' rule)", () => {
  // Sequence: at 0, tapping '−' must not move; at 1, tapping '−' lands at 0.
  let life = 1;
  if (canUpdateLife(life, -1, "up")) life -= 1;
  assert.equal(life, 0);
  if (canUpdateLife(life, -1, "up")) life -= 1;
  assert.equal(life, 0, "second tap at zero must be a no-op");
});
