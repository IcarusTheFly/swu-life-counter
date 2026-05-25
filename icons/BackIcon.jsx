import React from "react";
import Svg, {Path} from "react-native-svg";

export default function BackIcon({stroke = "currentColor", size = 22}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  );
}
