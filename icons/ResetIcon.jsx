import React from "react";
import Svg, {Path, Polyline} from "react-native-svg";

export default function ResetIcon({stroke = "currentColor"}) {
  return (
    <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" strokeWidth="3" stroke={stroke} fill="none">
      <Path d="M53.72,36.61A21.91,21.91,0,1,1,50.37,20.1" />
      <Polyline points="51.72 7.85 50.85 20.78 37.92 19.9" />
      <Path d="M53.72,36.61A21.91,21.91,0,1,1,50.37,20.1" />
      <Polyline points="51.72 7.85 50.85 20.78 37.92 19.9" />
    </Svg>
  );
}
