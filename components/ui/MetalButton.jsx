import React from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {METAL, RADIUS, TEXT, TYPE} from "../../constants/theme";

// Silver metallic button (the secondary action) — dark label for contrast.
// `icon` is an optional leading node. `compact` tightens it for inline use.
export default function MetalButton({label, onPress, icon = null, compact = false, accessibilityLabel, style}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({pressed}) => [styles.wrap, compact && styles.wrapCompact, pressed && styles.pressed, style]}
    >
      <LinearGradient colors={METAL.surface} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={[styles.surface, compact && styles.surfaceCompact]}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: METAL.border,
    borderTopColor: METAL.bevelLight,
    borderBottomColor: METAL.bevelDark,
    minHeight: 44
  },
  wrapCompact: {minHeight: 36},
  pressed: {opacity: 0.82},
  surface: {flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 14, minHeight: 44},
  surfaceCompact: {minHeight: 36, paddingHorizontal: 12},
  icon: {alignItems: "center", justifyContent: "center"},
  label: {color: TEXT.onMetal.primary, ...TYPE.title, fontSize: 14}
});
