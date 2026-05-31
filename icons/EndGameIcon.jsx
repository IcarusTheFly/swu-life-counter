import React from "react";
import Svg, {Path} from "react-native-svg";

// Bare stroked checkmark used by the in-game end-game pressable on the
// Divider. Shape mirrors `ResetIcon` — same viewBox + stroke width + prop
// surface — so the two pressables read as a matched pair in the divider
// cluster (see design.md Decision 11).
export default function EndGameIcon({stroke = "currentColor", size}) {
  const dimensionProps = size ? {width: size, height: size} : {};
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      strokeWidth="3"
      stroke={stroke}
      fill="none"
      {...dimensionProps}
    >
      <Path d="M16 33 L28 45 L48 21" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
