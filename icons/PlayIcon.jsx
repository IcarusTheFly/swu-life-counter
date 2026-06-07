import React from "react";
import Svg, {Path} from "react-native-svg";

// Solid right-pointing "play" triangle — the hero Start Game glyph. A faint
// dark edge keeps the white triangle legible over the light centre of the
// silver gradient.
export default function PlayIcon({color = "#FFFFFF", size = 22}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M22 14 L22 50 L50 32 Z" fill={color} stroke="rgba(0,0,0,0.35)" strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}
