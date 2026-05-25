// Lightsaber-inspired team color palette.
//
// Hex values match the inputs to `scripts/generate_color_variants.py`, so the
// in-game press tints, the SettingsScreen swatches, and the baked-in background
// line colors are visually consistent. The pipeline outputs are at
// `assets/bg_complete_<color>{,_landscape}.png` — referenced below.
//
// React Native requires `require()` paths to be static string literals at build
// time, so each color has its own pair of require()s. Add a new color here AND
// add a corresponding pair of generated assets to keep the map exhaustive.
//
// The list of valid keys also lives in `constants/teamColorKeys.js` (pure JS,
// no PNG requires) so node-based tests can import it. We assert below that the
// two stay in sync.

import {TEAM_COLOR_KEYS as VALID_KEYS} from "./teamColorKeys";

export const TEAM_COLORS = {
  red: {
    name: "Red",
    base: "#F54D00",
    press: "#F54D0066",
    bg: {
      portrait: require("../assets/bg_complete_red.png"),
      landscape: require("../assets/bg_complete_red_landscape.png")
    }
  },
  orange: {
    name: "Orange",
    base: "#FB8C00",
    press: "#FB8C0066",
    bg: {
      portrait: require("../assets/bg_complete_orange.png"),
      landscape: require("../assets/bg_complete_orange_landscape.png")
    }
  },
  yellow: {
    name: "Yellow",
    base: "#FDD835",
    press: "#FDD83566",
    bg: {
      portrait: require("../assets/bg_complete_yellow.png"),
      landscape: require("../assets/bg_complete_yellow_landscape.png")
    }
  },
  green: {
    name: "Green",
    base: "#22C55E",
    press: "#22C55E66",
    bg: {
      portrait: require("../assets/bg_complete_green.png"),
      landscape: require("../assets/bg_complete_green_landscape.png")
    }
  },
  blue: {
    name: "Blue",
    base: "#ADD8FF",
    press: "#ADD8FF66",
    bg: {
      portrait: require("../assets/bg_complete_blue.png"),
      landscape: require("../assets/bg_complete_blue_landscape.png")
    }
  },
  purple: {
    name: "Purple",
    base: "#C026D3",
    press: "#C026D366",
    bg: {
      portrait: require("../assets/bg_complete_purple.png"),
      landscape: require("../assets/bg_complete_purple_landscape.png")
    }
  },
  pink: {
    name: "Pink",
    base: "#FFC0CB",
    press: "#FFC0CB66",
    bg: {
      portrait: require("../assets/bg_complete_pink.png"),
      landscape: require("../assets/bg_complete_pink_landscape.png")
    }
  },
  white: {
    name: "White",
    base: "#FFFFFF",
    press: "#FFFFFF66",
    bg: {
      portrait: require("../assets/bg_complete_white.png"),
      landscape: require("../assets/bg_complete_white_landscape.png")
    }
  }
};

export const TEAM_COLOR_KEYS = Object.keys(TEAM_COLORS);

// Integrity check: the pure-JS key list and the full palette must stay aligned.
if (TEAM_COLOR_KEYS.length !== VALID_KEYS.length || TEAM_COLOR_KEYS.some((k, i) => k !== VALID_KEYS[i])) {
  // eslint-disable-next-line no-console
  console.warn(
    "[teamColors] TEAM_COLORS keys and teamColorKeys.js are out of sync.",
    "Expected:", VALID_KEYS,
    "Actual:", TEAM_COLOR_KEYS
  );
}
