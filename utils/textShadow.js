// Cross-platform text-shadow style helper.
//
// React Native Web 0.19 deprecated the `textShadowColor` / `textShadowOffset` /
// `textShadowRadius` longhand props in favor of a CSS-style `textShadow` shorthand.
// React Native core only accepts the longhand until 0.79 — Expo SDK 52 ships
// RN 0.76, so we can't blindly switch.
//
// This helper returns whichever shape the current platform accepts, so callers
// spread it into `StyleSheet.create` once and stay warning-free everywhere.
//
// Usage:
//   const styles = StyleSheet.create({
//     title: {
//       ...textShadow({color: "rgba(0,0,0,0.6)", offset: {width: 0, height: 2}, radius: 6}),
//       fontSize: 28,
//     },
//   });
//
// Once we upgrade past RN 0.79, this helper can collapse to always returning
// the shorthand form and the longhand branch can be dropped.

import {Platform} from "react-native";

export function textShadow({color, offset = {width: 0, height: 0}, radius = 0}) {
  if (Platform.OS === "web") {
    return {
      textShadow: `${offset.width}px ${offset.height}px ${radius}px ${color}`
    };
  }
  return {
    textShadowColor: color,
    textShadowOffset: offset,
    textShadowRadius: radius
  };
}
