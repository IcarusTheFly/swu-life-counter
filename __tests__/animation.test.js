// Functional tests for the animation-gating policy (utils/animation.js) — the
// pure logic that decides whether/how the app's animations run based on the two
// settings toggles. Runs under Node's built-in test runner via `npm test`.
//
// These exercise the SAME helpers the components use:
//   - `animatedDuration(base, enableAnimations)` gates the timed entry/feedback
//     animations (ConfirmationModal 180ms, DropdownSheet 160ms, Divider end-game
//     220ms, PlayerView life-change 300/500ms, InitiativeView pop 600/500ms) →
//     base when on, 0 (instant) when off.
//   - `shouldAnimateBackground(settings)` gates the SpaceBackground starfield
//     drift → true only when BOTH `animatedBackground` AND `enableAnimations`.

import test from "node:test";
import assert from "node:assert/strict";

import {animatedDuration, shouldAnimateBackground} from "../utils/animation.js";

// ---------------------------------------------------------------------------
// animatedDuration — the reduce-motion duration gate
// ---------------------------------------------------------------------------

test("animatedDuration: returns the base duration when animations are enabled", () => {
  assert.equal(animatedDuration(180, true), 180);
  assert.equal(animatedDuration(160, true), 160);
  assert.equal(animatedDuration(220, true), 220);
  assert.equal(animatedDuration(300, true), 300);
  assert.equal(animatedDuration(500, true), 500);
});

test("animatedDuration: returns 0 (instant) when animations are disabled", () => {
  assert.equal(animatedDuration(180, false), 0);
  assert.equal(animatedDuration(500, false), 0);
});

test("animatedDuration: only EXPLICIT false disables — unset/undefined defaults to ON", () => {
  // Components default the prop to `true`; sanitized settings are always
  // boolean. A stray undefined/null must NOT silently kill motion.
  assert.equal(animatedDuration(180, undefined), 180);
  assert.equal(animatedDuration(180, null), 180);
});

test("animatedDuration: preserves the exact base value (no rounding/clamping)", () => {
  assert.equal(animatedDuration(0, true), 0);
  assert.equal(animatedDuration(1234, true), 1234);
});

// ---------------------------------------------------------------------------
// shouldAnimateBackground — the starfield-drift gate (BOTH toggles required)
// ---------------------------------------------------------------------------

test("shouldAnimateBackground: animates only when BOTH toggles are on", () => {
  assert.equal(shouldAnimateBackground({animatedBackground: true, enableAnimations: true}), true);
});

test("shouldAnimateBackground: static when EITHER toggle is off", () => {
  assert.equal(shouldAnimateBackground({animatedBackground: false, enableAnimations: true}), false);
  assert.equal(shouldAnimateBackground({animatedBackground: true, enableAnimations: false}), false);
  assert.equal(shouldAnimateBackground({animatedBackground: false, enableAnimations: false}), false);
});

test("shouldAnimateBackground: reduce-motion (enableAnimations off) stills the background", () => {
  // Even with the dedicated toggle ON, the global reduce-motion preference wins.
  assert.equal(shouldAnimateBackground({animatedBackground: true, enableAnimations: false}), false);
});

test("shouldAnimateBackground: missing keys / bad input default to ON", () => {
  assert.equal(shouldAnimateBackground({}), true);
  assert.equal(shouldAnimateBackground(null), true);
  assert.equal(shouldAnimateBackground(undefined), true);
  assert.equal(shouldAnimateBackground("not an object"), true);
  // A legacy blob that predates `animatedBackground` → still animates when
  // animations are on, stills when they're off.
  assert.equal(shouldAnimateBackground({enableAnimations: true}), true);
  assert.equal(shouldAnimateBackground({enableAnimations: false}), false);
  // Only the dedicated toggle present.
  assert.equal(shouldAnimateBackground({animatedBackground: false}), false);
  assert.equal(shouldAnimateBackground({animatedBackground: true}), true);
});
