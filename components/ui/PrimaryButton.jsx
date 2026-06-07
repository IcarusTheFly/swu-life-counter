import React from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {METAL, RADIUS, TYPE} from "../../constants/theme";

// The primary call-to-action — a GOLD-metal surface (the "golden touch" is the
// fill itself, not a contour ring) with a neutral metallic bevel and dark, bold
// text for contrast. No surrounding gold outline / glow.
export default function PrimaryButton({label, onPress, icon = null, accessibilityLabel, style}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({pressed}) => [styles.wrap, pressed && styles.pressed, style]}
    >
      <LinearGradient colors={METAL.goldSurface} start={{x: 0, y: 0}} end={{x: 0, y: 1}} style={styles.surface}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: METAL.border,
    borderTopColor: METAL.bevelLight,
    borderBottomColor: METAL.bevelDark
  },
  pressed: {opacity: 0.85},
  surface: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16
  },
  icon: {alignItems: "center", justifyContent: "center"},
  label: {color: "#241a04", ...TYPE.title, fontSize: 17, letterSpacing: 1.2}
});
