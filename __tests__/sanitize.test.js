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
    lifeMode: "up",
    startingLife: 40
  };
  assert.deepEqual(sanitize(persisted), persisted);
});

test("sanitize rejects unknown color keys and falls back to defaults", () => {
  const persisted = {player1Color: "chartreuse", player2Color: "fuchsia"};
  const result = sanitize(persisted);
  assert.equal(result.player1Color, DEFAULT_SETTINGS.player1Color);
  assert.equal(result.player2Color, DEFAULT_SETTINGS.player2Color);
});

test("sanitize accepts the two new lightsaber keys (pink, white)", () => {
  const result = sanitize({player1Color: "pink", player2Color: "white"});
  assert.equal(result.player1Color, "pink");
  assert.equal(result.player2Color, "white");
});

test("sanitize rejects invalid lifeMode and falls back to default", () => {
  const result = sanitize({lifeMode: "sideways"});
  assert.equal(result.lifeMode, DEFAULT_SETTINGS.lifeMode);
});

test("sanitize accepts both valid lifeModes", () => {
  assert.equal(sanitize({lifeMode: "up"}).lifeMode, "up");
  assert.equal(sanitize({lifeMode: "down"}).lifeMode, "down");
});

test("sanitize clamps out-of-range startingLife to default", () => {
  assert.equal(sanitize({startingLife: 0}).startingLife, DEFAULT_SETTINGS.startingLife);
  assert.equal(sanitize({startingLife: 100}).startingLife, DEFAULT_SETTINGS.startingLife);
  assert.equal(sanitize({startingLife: -5}).startingLife, DEFAULT_SETTINGS.startingLife);
});

test("sanitize rejects non-integer startingLife (float, string, NaN)", () => {
  assert.equal(sanitize({startingLife: 30.5}).startingLife, DEFAULT_SETTINGS.startingLife);
  assert.equal(sanitize({startingLife: "30"}).startingLife, DEFAULT_SETTINGS.startingLife);
  assert.equal(sanitize({startingLife: NaN}).startingLife, DEFAULT_SETTINGS.startingLife);
});

test("sanitize accepts startingLife at the boundaries 1 and 99", () => {
  assert.equal(sanitize({startingLife: 1}).startingLife, 1);
  assert.equal(sanitize({startingLife: 99}).startingLife, 99);
});

test("sanitize merges partial input — keeps valid fields, defaults the rest", () => {
  const result = sanitize({player1Color: "purple", startingLife: 50});
  assert.equal(result.player1Color, "purple");
  assert.equal(result.startingLife, 50);
  assert.equal(result.player2Color, DEFAULT_SETTINGS.player2Color);
  assert.equal(result.lifeMode, DEFAULT_SETTINGS.lifeMode);
});

test("sanitize does not mutate the input object", () => {
  const persisted = {player1Color: "chartreuse", lifeMode: "sideways"};
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
