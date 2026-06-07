import React from "react";
import Svg, {Path} from "react-native-svg";

// A house — the Home tab glyph (roof + walls + door).
export default function HomeIcon({color = "#cfd3da", size = 16}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 11 L12 3 L21 11" />
      <Path d="M5 9.5 V20 H19 V9.5" />
      <Path d="M10 20 V14 H14 V20" />
    </Svg>
  );
}
