import React from "react";
import Svg, {Path} from "react-native-svg";

// A crown — the Home header's "Best Deck" glyph. The path is raised within the
// viewBox so the glyph's optical center sits at the box center (the original art
// hugged the bottom, which read as "too low" beside the deck name).
export default function CrownIcon({color = "#caa23a", size = 18}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M3 5.5 L6.5 9 L12 2.5 L17.5 9 L21 5.5 L19.5 16 L4.5 16 Z" />
      <Path d="M4.2 17.5 H19.8 V19 H4.2 Z" />
    </Svg>
  );
}
