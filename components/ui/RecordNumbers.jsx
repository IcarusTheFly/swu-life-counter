import React from "react";
import {StyleSheet, Text} from "react-native";
import {RECORD, TEXT} from "../../constants/theme";

// A deck / matchup record as NUMBERS ONLY (never the "W/L/D" letters) — each
// number colored so the ratio reads at a glance. `surface` picks the contrast
// set: dark, saturated tones on light metal; bright, lifted tones on the dark
// space backdrop. ALWAYS shows all three numbers (W-L-D), including a `0` draws,
// so records read consistently (e.g. "8-3-0", never "8-3").
export default function RecordNumbers({stats, surface = "onMetal", size = 14, style}) {
  const c = RECORD[surface] || RECORD.onMetal;
  const muted = (TEXT[surface] || TEXT.onMetal).muted;
  const wins = (stats && stats.wins) || 0;
  const losses = (stats && stats.losses) || 0;
  const draws = (stats && stats.draws) || 0;
  return (
    <Text style={[styles.base, {fontSize: size}, style]} numberOfLines={1}>
      <Text style={{color: c.win}}>{wins}</Text>
      <Text style={{color: muted}}>-</Text>
      <Text style={{color: c.loss}}>{losses}</Text>
      <Text style={{color: muted}}>-</Text>
      <Text style={{color: c.draw}}>{draws}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {fontFamily: "FiraCode_700Bold", letterSpacing: 0.3}
});
