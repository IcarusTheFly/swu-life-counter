import React from "react";
import {StyleSheet, Text, View} from "react-native";
import {TEXT, TYPE} from "../../constants/theme";

// One cell of the Home metallic header bar — CENTERED: the label on top, then an
// icon + value row below, both centered within the cell so the three stats read
// as a balanced, centered row. The value(s) come as children (so "Best Deck" can
// be name + record); a long name shrinks / truncates rather than pushing the
// cell out of alignment. On silver → dark text.
export default function HeaderStat({icon, label, children, style}) {
  return (
    <View style={[styles.cell, style]}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <View style={styles.valueRow}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <View style={styles.values}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {minWidth: 0, alignItems: "center"},
  label: {...TYPE.label, fontSize: 9, color: TEXT.onMetal.muted, marginBottom: 3, textAlign: "center"},
  valueRow: {flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minWidth: 0, maxWidth: "100%"},
  icon: {flexShrink: 0},
  values: {flexShrink: 1, minWidth: 0},
  value: {...TYPE.stat, color: TEXT.onMetal.primary, textAlign: "center"}
});

// Convenience value text style for callers (so the header reads consistently).
export const headerStatStyles = styles;
