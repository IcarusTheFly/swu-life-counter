import React from "react";
import {View} from "react-native";
import Svg, {Line, Polyline} from "react-native-svg";

// A tiny recent-form chart driven by `points` (a numeric series, e.g. from
// `recentForm`). Normalizes the series to the box; a flat/short series renders a
// flat baseline rather than nothing. Color is the deck's aspect accent.
export default function Sparkline({points, color = "#46d29a", width = 56, height = 22, strokeWidth = 2}) {
  const pad = strokeWidth;
  const usableW = width - pad * 2;
  const usableH = height - pad * 2;

  if (!points || points.length === 0) {
    return <View style={{width, height}} />;
  }

  if (points.length === 1) {
    const y = (pad + usableH / 2).toFixed(1);
    return (
      <Svg width={width} height={height}>
        <Line x1={pad} y1={y} x2={width - pad} y2={y} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      </Svg>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = usableW / (points.length - 1);
  const coords = points
    .map((p, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (p - min) / range) * usableH; // higher value → higher on screen
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <Svg width={width} height={height}>
      <Polyline points={coords} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
