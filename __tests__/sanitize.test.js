// Tests for the settings sanitizer.
//
// Runs via `npm test` (uses Node's built-in test runner — no Jest needed).
// Imports only pure-JS modules; nothing here touches React, AsyncStorage, or
// the PNG-bundling teamColors.js, so it works without the Metro bundler.

import test from "node:test";
import assert from "node:assert/strict";

import {sanitize} from "../context/sanitize.js";
import {DEFAULT_SETTINGS} from "../constants/settings.js";

test("sanitize returns defaults when given null", () => {
  assert.deepEqual(sanitize(null), DEFAULT_SETTINGS);
});

test("sanitize returns defaults when given undefined", () => {
  assert.deepEqual(sanitize(undefined), DEFAULT_SETTINGS);
});

test("sanitize returns defaults when given a non-object (string)", () => {
  assert.deepEqual(sanitize("not an object"), DEFAULT_SETTINGS);
});

test("sanitize accepts a fully valid persisted object verbatim", () => {
  const persisted = {
    player1Color: "blue",
    player2Color: "pink",
    initialLife: 40,
    enableAnimations: false,
    enableHaptics: true
  };
  assert.deepEqual(sanitize(persisted), persisted);
});

test("sanitize rejects unknown color keys and falls back to defaults", () => {
  const persisted = {player1Color: "chartreuse", player2Color: "fuchsia"};
  const result = sanitize(persisted);
  assert.equal(result.player1Color, DEFAULT_SETTINGS.player1Color);
  assert.equal(result.player2Color, DEFAULT_SETTINGS.player2Color);
});

test("sanitize accepts the two lightsaber keys added in the previous change (pink, white)", () => {
  const result = sanitize({player1Color: "pink", player2Color: "white"});
  assert.equal(result.player1Color, "pink");
  assert.equal(result.player2Color, "white");
});

test("sanitize clamps out-of-range initialLife to default", () => {
  // initialLife range is [0, 99]; -1 and 100 are out
  assert.equal(sanitize({initialLife: -1}).initialLife, DEFAULT_SETTINGS.initialLife);
  assert.equal(sanitize({initialLife: 100}).initialLife, DEFAULT_SETTINGS.initialLife);
  assert.equal(sanitize({initialLife: -50}).initialLife, DEFAULT_SETTINGS.initialLife);
});

test("sanitize rejects non-integer initialLife (float, string, NaN)", () => {
  assert.equal(sanitize({initialLife: 30.5}).initialLife, DEFAULT_SETTINGS.initialLife);
  assert.equal(sanitize({initialLife: "30"}).initialLife, DEFAULT_SETTINGS.initialLife);
  assert.equal(sanitize({initialLife: NaN}).initialLife, DEFAULT_SETTINGS.initialLife);
});

test("sanitize accepts initialLife at the boundaries 0 and 99 (0 is now valid)", () => {
  assert.equal(sanitize({initialLife: 0}).initialLife, 0);
  assert.equal(sanitize({initialLife: 99}).initialLife, 99);
});

// Migration tests — drop lifeMode entirely; map legacy keys to initialLife.

test("migration: legacy {lifeMode: 'up', startingLife: 25} becomes initialLife 0 (preserves Count Up start)", () => {
  const persisted = {lifeMode: "up", startingLife: 25, player1Color: "red", player2Color: "blue"};
  const result = sanitize(persisted);
  assert.equal(result.initialLife, 0, "Count Up users had games start at 0; migration honors that");
  assert.equal(result.player1Color, "red");
  assert.equal(result.player2Color, "blue");
});

test("migration: legacy {lifeMode: 'down', startingLife: 40} becomes initialLife 40", () => {
  const result = sanitize({lifeMode: "down", startingLife: 40});
  assert.equal(result.initialLife, 40);
});

test("migration: legacy startingLife without lifeMode becomes initialLife", () => {
  const result = sanitize({startingLife: 50});
  assert.equal(result.initialLife, 50);
});

test("migration: lifeMode 'up' takes precedence over a stored startingLife", () => {
  // The user was in Count Up but had a residual startingLife from before
  // they switched modes. Migration should still land at 0.
  const result = sanitize({lifeMode: "up", startingLife: 30});
  assert.equal(result.initialLife, 0);
});

test("migration: new initialLife wins over legacy keys when both are present", () => {
  const result = sanitize({initialLife: 15, lifeMode: "up", startingLife: 40});
  assert.equal(result.initialLife, 15);
});

test("sanitized output never contains lifeMode or startingLife keys", () => {
  const result = sanitize({lifeMode: "down", startingLife: 30, initialLife: 30});
  assert.ok(!("lifeMode" in result), "lifeMode must not appear in sanitized output");
  assert.ok(!("startingLife" in result), "startingLife must not appear in sanitized output");
});

test("enableAnimations: accepts true and false", () => {
  assert.equal(sanitize({enableAnimations: true}).enableAnimations, true);
  assert.equal(sanitize({enableAnimations: false}).enableAnimations, false);
});

test("enableAnimations: rejects non-boolean and falls back to default (true)", () => {
  assert.equal(sanitize({enableAnimations: "yes"}).enableAnimations, DEFAULT_SETTINGS.enableAnimations);
  assert.equal(sanitize({enableAnimations: 1}).enableAnimations, DEFAULT_SETTINGS.enableAnimations);
  assert.equal(sanitize({enableAnimations: null}).enableAnimations, DEFAULT_SETTINGS.enableAnimations);
  assert.equal(sanitize({}).enableAnimations, DEFAULT_SETTINGS.enableAnimations);
});

test("enableHaptics: accepts true and false", () => {
  assert.equal(sanitize({enableHaptics: true}).enableHaptics, true);
  assert.equal(sanitize({enableHaptics: false}).enableHaptics, false);
});

test("enableHaptics: rejects non-boolean and falls back to default (false)", () => {
  assert.equal(sanitize({enableHaptics: "yes"}).enableHaptics, DEFAULT_SETTINGS.enableHaptics);
  assert.equal(sanitize({enableHaptics: 0}).enableHaptics, DEFAULT_SETTINGS.enableHaptics);
  assert.equal(sanitize({}).enableHaptics, DEFAULT_SETTINGS.enableHaptics);
});

test("sanitize merges partial input — keeps valid fields, defaults the rest", () => {
  const result = sanitize({player1Color: "purple", initialLife: 50});
  assert.equal(result.player1Color, "purple");
  assert.equal(result.initialLife, 50);
  assert.equal(result.player2Color, DEFAULT_SETTINGS.player2Color);
  assert.equal(result.enableAnimations, DEFAULT_SETTINGS.enableAnimations);
  assert.equal(result.enableHaptics, DEFAULT_SETTINGS.enableHaptics);
});

test("sanitize does not mutate the input object", () => {
  const persisted = {player1Color: "chartreuse", lifeMode: "up"};
  const snapshot = JSON.parse(JSON.stringify(persisted));
  sanitize(persisted);
  assert.deepEqual(persisted, snapshot);
});

test("sanitize does not mutate DEFAULT_SETTINGS", () => {
  const defaultsSnapshot = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  const result = sanitize({player1Color: "blue"});
  result.player1Color = "tampered"; // mutate the result
  assert.deepEqual(DEFAULT_SETTINGS, defaultsSnapshot, "defaults should be untouched");
});
