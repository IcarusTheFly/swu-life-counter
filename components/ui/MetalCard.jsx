import React from "react";
import {StyleSheet, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {METAL, RADIUS} from "../../constants/theme";

// Brushed-silver beveled surface — the base metallic card of the design system.
// `edge` paints a colored left bar (a deck's aspect); `gold` swaps to the
// gold-tinted metal. Inner padding is the caller's (content varies).
export default function MetalCard({children, style, edge, gold = false, radius = RADIUS.lg}) {
  return (
    <View style={[styles.wrap, {borderRadius: radius}, style]}>
      <LinearGradient
        colors={gold ? METAL.goldSurface : METAL.surface}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.surface, {borderRadius: radius}]}
      >
        {edge ? <View style={[styles.edge, {backgroundColor: edge}]} /> : null}
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: METAL.border,
    borderTopColor: METAL.bevelLight,
    borderBottomColor: METAL.bevelDark,
    overflow: "hidden"
  },
  surface: {flex: 1},
  edge: {position: "absolute", left: 0, top: 0, bottom: 0, width: 4}
});
