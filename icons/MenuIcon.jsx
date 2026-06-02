import React from "react";
import Svg, {Line} from "react-native-svg";

// Hamburger menu icon — three rounded horizontal lines. Replaces the in-game
// reset/refresh glyph on the divider (the control opens a menu of options:
// Reset Life / Return to Home). Matches the `stroke`-prop convention of the
// other icons (BackIcon / ResetIcon / EndGameIcon) so it drops into the same
// metallic circle button.
export default function MenuIcon({stroke = "currentColor"}) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      strokeWidth="6"
      stroke={stroke}
      fill="none"
      strokeLinecap="round"
    >
      <Line x1="16" y1="22" x2="48" y2="22" />
      <Line x1="16" y1="32" x2="48" y2="32" />
      <Line x1="16" y1="42" x2="48" y2="42" />
    </Svg>
  );
}
