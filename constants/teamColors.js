// Lightsaber-inspired team color palette.
//
// Hex values match the inputs to `scripts/generate_color_variants.py`, so the
// in-game press tints, the Settings color dropdowns, and the curved-line
// overlays are visually consistent.
//
// `lines` points at the TRANSPARENT, line-only overlays
// (`assets/bg_separated_lines_<color>{,_landscape}.png` — line + glow on a
// transparent background). In-game these are drawn ON TOP of the shared
// animated space backdrop, per half, so the curved lines appear only during a
// game (the `modernize-ui` change). The old opaque `bg_complete_<color>` PNGs
// (space + lines baked together) are kept on disk but no longer rendered.
//
// React Native requires `require()` paths to be static string literals at build
// time, so each color has its own pair of require()s. Add a new color here AND
// add the corresponding generated overlays to keep the map exhaustive.
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
    lines: {
      portrait: require("../assets/bg_separated_lines_red.png"),
      landscape: require("../assets/bg_separated_lines_red_landscape.png")
    }
  },
  orange: {
    name: "Orange",
    base: "#FB8C00",
    press: "#FB8C0066",
    lines: {
      portrait: require("../assets/bg_separated_lines_orange.png"),
      landscape: require("../assets/bg_separated_lines_orange_landscape.png")
    }
  },
  yellow: {
    name: "Yellow",
    base: "#FDD835",
    press: "#FDD83566",
    lines: {
      portrait: require("../assets/bg_separated_lines_yellow.png"),
      landscape: require("../assets/bg_separated_lines_yellow_landscape.png")
    }
  },
  green: {
    name: "Green",
    base: "#22C55E",
    press: "#22C55E66",
    lines: {
      portrait: require("../assets/bg_separated_lines_green.png"),
      landscape: require("../assets/bg_separated_lines_green_landscape.png")
    }
  },
  blue: {
    name: "Blue",
    base: "#ADD8FF",
    press: "#ADD8FF66",
    lines: {
      portrait: require("../assets/bg_separated_lines_blue.png"),
      landscape: require("../assets/bg_separated_lines_blue_landscape.png")
    }
  },
  purple: {
    name: "Purple",
    base: "#C026D3",
    press: "#C026D366",
    lines: {
      portrait: require("../assets/bg_separated_lines_purple.png"),
      landscape: require("../assets/bg_separated_lines_purple_landscape.png")
    }
  },
  pink: {
    name: "Pink",
    base: "#FFC0CB",
    press: "#FFC0CB66",
    lines: {
      portrait: require("../assets/bg_separated_lines_pink.png"),
      landscape: require("../assets/bg_separated_lines_pink_landscape.png")
    }
  },
  white: {
    name: "White",
    base: "#FFFFFF",
    press: "#FFFFFF66",
    lines: {
      portrait: require("../assets/bg_separated_lines_white.png"),
      landscape: require("../assets/bg_separated_lines_white_landscape.png")
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
