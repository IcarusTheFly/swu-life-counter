import React from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {textShadow} from "../utils/textShadow";
import {GRADIENTS} from "../constants/theme";

// Menu control with three weights (the redesign-home-and-visuals hierarchy):
//   - "hero"  → the single loud primary (Start Game): brushed silver, taller,
//               a bright accent border ring, optional leading icon.
//   - "tile"  → a lighter secondary action (Decks / Settings): muted steel,
//               icon stacked over the label, flexes to share a row.
//   - default → the original full-width silver button (unchanged), kept for
//               any caller that wants the plain treatment.
// `icon` is an already-rendered node (e.g. <PlayIcon/>); the caller chooses its
// colour/size to suit the variant.
export default function MenuButton({label, onPress, accessibilityLabel, variant = "default", icon = null}) {
  const isHero = variant === "hero";
  const isTile = variant === "tile";
  const colors = isTile ? GRADIENTS.STEEL : GRADIENTS.SILVER;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({pressed}) => [
        styles.pressable,
        isTile ? styles.pressableTile : styles.pressableFull,
        isHero && styles.pressableHero,
        pressed && styles.pressed
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.gradient, isHero && styles.gradientHero, isTile && styles.gradientTile]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={[styles.label, isHero && styles.labelHero, isTile && styles.labelTile]} numberOfLines={1}>
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Shared frame; width/flex + per-variant overrides layer on top.
  pressable: {
    minHeight: 56,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#cccccc55"
  },
  pressableFull: {
    width: "100%"
  },
  pressed: {
    opacity: 0.85
  },
  gradient: {
    flex: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  icon: {
    alignItems: "center",
    justifyContent: "center"
  },
  label: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 18,
    letterSpacing: 1.5,
    ...textShadow({color: "rgba(0,0,0,0.5)", offset: {width: 0, height: 2}, radius: 4})
  },
  // ── hero (Start Game) — the loud primary ──
  pressableHero: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e9ecf2"
  },
  gradientHero: {
    minHeight: 72,
    gap: 12
  },
  labelHero: {
    fontSize: 22,
    letterSpacing: 2
  },
  // ── tile (Decks / Settings) — lighter, recedes ──
  pressableTile: {
    flex: 1,
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffffff1f"
  },
  gradientTile: {
    minHeight: 76,
    flexDirection: "column",
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 12
  },
  labelTile: {
    fontSize: 13,
    letterSpacing: 1,
    color: "#e8e8ee"
  }
});
