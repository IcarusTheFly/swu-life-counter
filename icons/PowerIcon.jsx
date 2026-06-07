import React from "react";
import Svg, {Path, Line} from "react-native-svg";

// Power / standby symbol — a ring broken at the top with a vertical bar through
// the gap. Used for the Exit footer chip.
export default function PowerIcon({color = "#cfd3da", size = 16}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7.1 6.7 a 7 7 0 1 0 9.8 0" />
      <Line x1="12" y1="3" x2="12" y2="11.5" />
    </Svg>
  );
}
