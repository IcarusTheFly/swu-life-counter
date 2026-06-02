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
    animatedBackground: false,
    enableHaptics: true,
    defaultDeckId: null,
    defaultOpponentDeckId: null,
    activeLoadout: {player1DeckId: null, player2DeckId: "__random__"}
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

test("animatedBackground: accepts true and false", () => {
  assert.equal(sanitize({animatedBackground: true}).animatedBackground, true);
  assert.equal(sanitize({animatedBackground: false}).animatedBackground, false);
});

test("animatedBackground: defaults to true and is on by default", () => {
  // Fresh install / legacy blob (no key) → enabled.
  assert.equal(DEFAULT_SETTINGS.animatedBackground, true);
  assert.equal(sanitize({}).animatedBackground, true);
  assert.equal(sanitize({player1Color: "red"}).animatedBackground, true);
});

test("animatedBackground: coerces non-boolean to the default (true)", () => {
  assert.equal(sanitize({animatedBackground: "no"}).animatedBackground, DEFAULT_SETTINGS.animatedBackground);
  assert.equal(sanitize({animatedBackground: 0}).animatedBackground, DEFAULT_SETTINGS.animatedBackground);
  assert.equal(sanitize({animatedBackground: null}).animatedBackground, DEFAULT_SETTINGS.animatedBackground);
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

// Deck-tracking `activeLoadout` field. `activeLoadout` is
// `{player1DeckId: string|null|"__random__", player2DeckId: string|null|"__random__"}`.
// Both sides may be a deck id, null, or `"__random__"` (v3.1 — either side
// may be Random; recordability is gated in-game by at-least-one-real-deck).
// (The `defaultDeckId` field — renamed back from the v2 `defaultPlayerDeckId` —
// is covered in the v3 section below.)

test("activeLoadout: a fully valid loadout passes through", () => {
  const result = sanitize({
    activeLoadout: {player1DeckId: "deck_x", player2DeckId: "deck_y"}
  });
  assert.deepEqual(result.activeLoadout, {
    player1DeckId: "deck_x",
    player2DeckId: "deck_y"
  });
});

test("activeLoadout: __random__ on the opponent side passes through", () => {
  const result = sanitize({
    activeLoadout: {player1DeckId: "deck_x", player2DeckId: "__random__"}
  });
  assert.deepEqual(result.activeLoadout, {
    player1DeckId: "deck_x",
    player2DeckId: "__random__"
  });
});

test("activeLoadout: __random__ is now allowed on the player side too (both sides may be Random)", () => {
  const result = sanitize({
    activeLoadout: {player1DeckId: "__random__", player2DeckId: "deck_y"}
  });
  assert.equal(result.activeLoadout.player1DeckId, "__random__");
  assert.equal(result.activeLoadout.player2DeckId, "deck_y");
});

test("activeLoadout: both sides may be Random", () => {
  const result = sanitize({
    activeLoadout: {player1DeckId: "__random__", player2DeckId: "__random__"}
  });
  assert.deepEqual(result.activeLoadout, {player1DeckId: "__random__", player2DeckId: "__random__"});
});

test("activeLoadout: null is allowed on either side (not mandatory to select a deck)", () => {
  const result = sanitize({
    activeLoadout: {player1DeckId: null, player2DeckId: null}
  });
  assert.equal(result.activeLoadout.player1DeckId, null);
  assert.equal(result.activeLoadout.player2DeckId, null);
});

test("defaultOpponentDeckId: accepts a string id, null; rejects __random__ and bad types", () => {
  assert.equal(sanitize({defaultOpponentDeckId: "deck_op"}).defaultOpponentDeckId, "deck_op");
  assert.equal(sanitize({defaultOpponentDeckId: null}).defaultOpponentDeckId, null);
  assert.equal(sanitize({defaultOpponentDeckId: "__random__"}).defaultOpponentDeckId, null);
  assert.equal(sanitize({defaultOpponentDeckId: 42}).defaultOpponentDeckId, null);
  assert.equal(sanitize({}).defaultOpponentDeckId, null);
});

test("activeLoadout: missing loadout falls back to the default {null, '__random__'}", () => {
  const result = sanitize({});
  assert.deepEqual(result.activeLoadout, DEFAULT_SETTINGS.activeLoadout);
  assert.deepEqual(result.activeLoadout, {player1DeckId: null, player2DeckId: "__random__"});
});

test("activeLoadout: non-object loadout (string) falls back to the default", () => {
  const result = sanitize({activeLoadout: "not an object"});
  assert.deepEqual(result.activeLoadout, DEFAULT_SETTINGS.activeLoadout);
});

test("activeLoadout: non-object loadout (number) falls back to the default", () => {
  const result = sanitize({activeLoadout: 42});
  assert.deepEqual(result.activeLoadout, DEFAULT_SETTINGS.activeLoadout);
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

// ===========================================================================
// v3 SANITIZE — `defaultDeckId` (renamed back from v2 `defaultPlayerDeckId`)
//               + legacy `defaultPlayerDeckId` read
// ===========================================================================
//
// Per `openspec/changes/refine-deck-tracking/specs/settings/spec.md`:
//   - The persisted settings field is RENAMED from `defaultPlayerDeckId` (the
//     v2 name) back to `defaultDeckId` (v3 — there is one shared deck pool
//     again). The sanitize layer accepts BOTH on read (the new `defaultDeckId`
//     wins if both are present; the old `defaultPlayerDeckId` is read once
//     during the migration window otherwise). Writes always use `defaultDeckId`.
//   - The player-side rejection of `"__random__"` is preserved against the
//     new key (the player side can NEVER be `"__random__"`, only the opponent).
//   - The `activeLoadout` shape is unchanged at the sanitize layer (both ids
//     reference the single shared `decks` list; the self-heal is enforced one
//     layer up in App.jsx — see tasks.md §6).

test("defaultDeckId: accepts a string id verbatim", () => {
  const result = sanitize({defaultDeckId: "deck_xyz"});
  assert.equal(result.defaultDeckId, "deck_xyz");
});

test("defaultDeckId: accepts null", () => {
  const result = sanitize({defaultDeckId: null});
  assert.equal(result.defaultDeckId, null);
});

test("defaultDeckId: rejects a number and falls back to default (null)", () => {
  const result = sanitize({defaultDeckId: 42});
  assert.equal(result.defaultDeckId, null);
});

test("defaultDeckId: rejects an empty string and falls back to default (null)", () => {
  const result = sanitize({defaultDeckId: ""});
  assert.equal(result.defaultDeckId, null);
});

test("defaultDeckId: rejects the __random__ sentinel (the player/default side is never random)", () => {
  // The sentinel is only valid on the OPPONENT side. The default deck can
  // NEVER be random — the sanitize layer SHOULD reject it.
  const result = sanitize({defaultDeckId: "__random__"});
  assert.equal(result.defaultDeckId, null);
});

test("legacy defaultPlayerDeckId: is surfaced as defaultDeckId during migration window (one read)", () => {
  // v2 → v3 migration window: the persisted blob still has the v2 key.
  // Sanitize should READ it once and output under the NEW key.
  const result = sanitize({defaultPlayerDeckId: "deck_xyz"});
  assert.equal(result.defaultDeckId, "deck_xyz");
});

test("legacy defaultPlayerDeckId: null on the old key is preserved (still null on the new key)", () => {
  const result = sanitize({defaultPlayerDeckId: null});
  assert.equal(result.defaultDeckId, null);
});

test("legacy defaultPlayerDeckId: invalid type on the old key falls back to null on the new key", () => {
  const result = sanitize({defaultPlayerDeckId: 42});
  assert.equal(result.defaultDeckId, null);
});

test("new defaultDeckId wins when both old and new keys are present", () => {
  // Belt-and-suspenders: if both keys are somehow present (mid-update?),
  // the new key SHOULD take precedence.
  const result = sanitize({
    defaultPlayerDeckId: "old_id",
    defaultDeckId: "new_id"
  });
  assert.equal(result.defaultDeckId, "new_id");
});

test("sanitized output does not echo back the legacy defaultPlayerDeckId key", () => {
  // The new sanitize output should not carry both keys forward — only
  // `defaultDeckId` should appear in the shape. Subsequent writes use only
  // the new key.
  const result = sanitize({defaultPlayerDeckId: "deck_xyz"});
  assert.ok(
    !("defaultPlayerDeckId" in result),
    "the legacy defaultPlayerDeckId key MUST NOT appear in sanitized output"
  );
});

test("activeLoadout (v3): shape is unchanged at the sanitize layer (player1DeckId/player2DeckId)", () => {
  // The activeLoadout shape stays the same at this layer — `player1DeckId`
  // refers to the SIDE; both ids reference the single shared `decks` list,
  // and the self-heal is enforced one layer up in App.jsx.
  const result = sanitize({
    activeLoadout: {player1DeckId: "deck_x", player2DeckId: "deck_y"}
  });
  assert.deepEqual(result.activeLoadout, {
    player1DeckId: "deck_x",
    player2DeckId: "deck_y"
  });
});

test("activeLoadout (v3): __random__ on player2 still passes through (opponent may be random)", () => {
  const result = sanitize({
    activeLoadout: {player1DeckId: "deck_x", player2DeckId: "__random__"}
  });
  assert.equal(result.activeLoadout.player1DeckId, "deck_x");
  assert.equal(result.activeLoadout.player2DeckId, "__random__");
});

test("activeLoadout (v3.1): __random__ on player1 is now allowed (both sides may be Random)", () => {
  // The earlier "player side is never random" rule was removed — either side
  // may be Random, with at-least-one-real-deck gating recordability in-game.
  const result = sanitize({
    activeLoadout: {player1DeckId: "__random__", player2DeckId: "deck_y"}
  });
  assert.equal(result.activeLoadout.player1DeckId, "__random__");
  assert.equal(result.activeLoadout.player2DeckId, "deck_y");
});
