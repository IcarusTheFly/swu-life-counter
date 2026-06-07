import React from "react";
import Svg, {Line, Circle} from "react-native-svg";

// Two crossed lightsabers — the Home header's "Games" glyph. Each saber reads
// as an actual saber (not a plain "X"): a THICK hilt (handle) at the bottom and
// a THINNER blade with a rounded tip running up to the opposite top corner,
// plus a pommel dot at the handle's end. The hilt + blade of each saber are
// collinear, so each is one straight diagonal that simply thickens at the grip.
export default function SabersIcon({color = "#3b3e45", size = 18}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Blades (thin beams, rounded tips at the top corners) */}
      <Line x1="8" y1="16" x2="21" y2="3" strokeWidth="1.7" />
      <Line x1="16" y1="16" x2="3" y2="3" strokeWidth="1.7" />
      {/* Hilts (thick handles at the bottom corners) */}
      <Line x1="3.8" y1="20.2" x2="8" y2="16" strokeWidth="3.3" />
      <Line x1="20.2" y1="20.2" x2="16" y2="16" strokeWidth="3.3" />
      {/* Pommels (handle ends) */}
      <Circle cx="3.6" cy="20.4" r="1.5" fill={color} stroke="none" />
      <Circle cx="20.4" cy="20.4" r="1.5" fill={color} stroke="none" />
    </Svg>
  );
}
