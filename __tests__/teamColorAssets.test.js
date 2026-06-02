// Catches the "added a color but forgot to regenerate background images" foot-gun.
//
// `teamColors.js` static-requires `bg_separated_lines_<key>{,_landscape}.png`
// (the transparent, team-colored curved-line overlays drawn in-game, on top of
// the shared animated space) per color — Metro would fail at bundle time if a
// PNG is missing, but that's a slow, noisy failure mode. This test fails fast
// at `npm test` time instead.
//
// Imports `teamColorKeys.js` (pure JS) rather than `teamColors.js` (which would
// pull in PNG requires that Node can't resolve).

import test from "node:test";
import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";

import {TEAM_COLOR_KEYS} from "../constants/teamColorKeys.js";

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");

test("teamColorKeys is non-empty and covers the lightsaber set", () => {
  assert.ok(TEAM_COLOR_KEYS.length >= 4, "spec requires at least 4 colors per side");
  for (const required of ["red", "green", "blue", "pink", "white"]) {
    assert.ok(TEAM_COLOR_KEYS.includes(required), `palette must include ${required}`);
  }
});

test("teamColorKeys entries are lowercase alphanumeric (safe for filenames + storage)", () => {
  for (const key of TEAM_COLOR_KEYS) {
    assert.match(key, /^[a-z0-9]+$/, `${key} must be lowercase alphanumeric`);
  }
});

test("every team color has its portrait + landscape line-overlay PNGs on disk", () => {
  const missing = [];
  for (const key of TEAM_COLOR_KEYS) {
    for (const variant of ["", "_landscape"]) {
      const file = join(ASSETS_DIR, `bg_separated_lines_${key}${variant}.png`);
      if (!existsSync(file)) missing.push(`bg_separated_lines_${key}${variant}.png`);
    }
  }
  assert.deepEqual(
    missing,
    [],
    `Missing generated assets — run \`py scripts/generate_color_variants.py\`:\n  ${missing.join("\n  ")}`
  );
});
