import React, {useEffect, useMemo, useRef} from "react";
import {Animated, Platform, StyleSheet, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useSettings} from "../context/SettingsContext";
import {SPACE_BASE, SPACE_GRADIENT} from "../constants/theme";
import {shouldAnimateBackground} from "../utils/animation";

// react-native-web has no native animated module; the project's standard gate.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

// Shared animated space backdrop (the `modernize-ui` change). Rendered ONCE,
// globally, behind every screen (see ScreenLayout). A deep-space gradient with
// 3 parallax starfield layers; each layer drifts + breathes via a SINGLE
// Animated.Value (so the whole thing is 3 native-driven loops, not 50+), which
// keeps it cheap on Android where the screen is kept awake for a whole game.
//
// Gating: the layers animate only when `animatedBackground` AND the global
// `enableAnimations` (reduce-motion) are both on; otherwise the identical
// stars are painted at rest (no timers) — so toggling motion off never shifts
// layout, it just stills the field.
//
// Perf rules (also the Android-correctness contract): animate ONLY
// transform/opacity (native-driver-safe), seed the layout ONCE at mount, and
// fill the whole window via absoluteFill. The star COUNT is high (a dense
// field, like the original baked background) but cheap: cost scales with the
// number of static leaf Views, NOT the animation — there are still only 3
// drivers (one per parallax layer), so motion stays at 3 native-driven loops.
const LAYERS = [
  {count: 180, size: [1, 2], opacity: [0.18, 0.5], drift: 6, breathe: 0.08, duration: 9000},
  {count: 120, size: [1.5, 2.5], opacity: [0.3, 0.7], drift: 10, breathe: 0.12, duration: 13000},
  {count: 70, size: [2, 3.5], opacity: [0.5, 1], drift: 16, breathe: 0.16, duration: 17000}
];

function seedStars(count, sizeRange, opacityRange) {
  const stars = [];
  for (let i = 0; i < count; i += 1) {
    const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
    stars.push({
      key: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size,
      opacity: opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0])
    });
  }
  return stars;
}

export default function SpaceBackground() {
  const {settings} = useSettings();
  // Default-safe: treat an unset field as "on" so legacy/partial settings still
  // animate. Reduce-motion (`enableAnimations === false`) forces static.
  const animate = shouldAnimateBackground(settings);

  // Seed the star layout exactly once for the app's lifetime.
  const layers = useMemo(
    () => LAYERS.map((l) => ({...l, stars: seedStars(l.count, l.size, l.opacity)})),
    []
  );
  const drivers = useRef(LAYERS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!animate) {
      drivers.forEach((v) => v.setValue(0));
      return undefined;
    }
    const loops = drivers.map((v, i) =>
      Animated.loop(
        Animated.timing(v, {
          toValue: 1,
          duration: LAYERS[i].duration,
          useNativeDriver: USE_NATIVE_DRIVER
        })
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [animate, drivers]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={SPACE_GRADIENT} style={styles.fill} start={{x: 0, y: 0}} end={{x: 0, y: 1}} />
      {layers.map((layer, i) => {
        const v = drivers[i];
        // Gentle yoyo drift (0 → -drift → 0) + a subtle opacity breath. Both
        // are transform/opacity only, so they ride the native driver.
        const translateY = v.interpolate({inputRange: [0, 0.5, 1], outputRange: [0, -layer.drift, 0]});
        const opacity = v.interpolate({inputRange: [0, 0.5, 1], outputRange: [1, 1 - layer.breathe, 1]});
        return (
          <Animated.View key={i} style={[styles.fill, {transform: [{translateY}], opacity}]}>
            {layer.stars.map((s) => (
              <View
                key={s.key}
                style={{
                  position: "absolute",
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  width: s.size,
                  height: s.size,
                  borderRadius: s.size / 2,
                  backgroundColor: "#FFFFFF",
                  opacity: s.opacity
                }}
              />
            ))}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // The root never intercepts touches (it sits behind all content). Solid base
  // tone prevents any pre-gradient flash. Full-bleed across the whole window
  // (incl. behind hidden Android system bars + cutouts).
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPACE_BASE,
    overflow: "hidden",
    pointerEvents: "none"
  },
  fill: StyleSheet.absoluteFillObject
});
