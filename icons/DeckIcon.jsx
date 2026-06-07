import React from "react";
import Svg, {Path, Rect} from "react-native-svg";

// A stack-of-cards glyph — the Decks chip. A front card with a second card
// peeking out behind it toward the TOP-LEFT corner (its top + left edges show).
export default function DeckIcon({color = "#cfd3da", size = 16}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M41 13 H17 a4 4 0 0 0 -4 4 V47" />
      <Rect x="23" y="21" width="28" height="34" rx="4" />
    </Svg>
  );
}
