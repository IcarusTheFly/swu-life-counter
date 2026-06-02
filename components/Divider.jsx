import React, {useCallback, useEffect, useRef, useState} from "react";
import {Animated, Platform, Pressable, StyleSheet, Text, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import MenuIcon from "../icons/MenuIcon";
import EndGameIcon from "../icons/EndGameIcon";
import {textShadow} from "../utils/textShadow";
import {GRADIENTS} from "../constants/theme";
import {animatedDuration} from "../utils/animation";

// Mirrors PlayerView's gate — react-native-web has no native animated module.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

// The in-game divider grew from a single reset pressable to a two-button
// cluster. Per design.md Decision 10 the end-game button is ALWAYS
// rendered for discoverability: full opacity + interactive when there's
// something to record (`enabled` true), dimmed + non-interactive when
// nothing can be recorded. The reset pressable keeps its same left-of-end-game
// position (we do NOT re-center it when end-game is disabled).
//
// Continuous line (Issue 2): the separating line is now a SINGLE full-width
// element that spans the whole screen behind the button cluster, so there's
// no gap between the two buttons. The line is absolutely positioned at the
// vertical midpoint of the container and the button cluster is overlaid on
// top of it (the cluster has its own translucent backdrop so the line reads
// as "passing behind" the buttons rather than colliding with the icons).
//
// Mount animation note: when the end-game button first becomes enabled it
// fades + scales in over 220ms (gated on `enableAnimations` — `duration: 0`
// when off). The reset pressable has no entry animation; it's been on screen
// since the start of the game.
//
// Disabled discoverability: tapping the dimmed end-game button surfaces a
// transient inline hint telling the user to pick at least one real deck. The
// deck can be changed in-game (the badge is a picker) so the hint nudges the
// user toward that affordance rather than opening a picker here.
const HIT_SLOP = {top: 8, bottom: 8, left: 4, right: 4};
const HINT_TEXT = "Pick at least one real deck to record";
const HINT_DURATION_MS = 2000;

export default function Divider({
  onPress = () => {},
  enabled = false,
  onEndGame = () => {},
  enableAnimations = true
}) {
  const endGameOpacity = useRef(new Animated.Value(0)).current;
  const endGameScale = useRef(new Animated.Value(0.85)).current;
  const [hintVisible, setHintVisible] = useState(false);
  const hintTimeout = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const duration = animatedDuration(220, enableAnimations);
    Animated.parallel([
      Animated.timing(endGameOpacity, {toValue: 1, duration, useNativeDriver: USE_NATIVE_DRIVER}),
      Animated.timing(endGameScale, {toValue: 1, duration, useNativeDriver: USE_NATIVE_DRIVER})
    ]).start();
  }, [enabled, enableAnimations, endGameOpacity, endGameScale]);

  // Clear any pending hint timeout on unmount.
  useEffect(() => () => clearTimeout(hintTimeout.current), []);

  // Tapping the disabled end-game button shows a brief inline hint. When the
  // control becomes enabled the hint is irrelevant, so we hide it.
  const showHint = useCallback(() => {
    clearTimeout(hintTimeout.current);
    setHintVisible(true);
    hintTimeout.current = setTimeout(() => setHintVisible(false), HINT_DURATION_MS);
  }, []);

  useEffect(() => {
    if (enabled && hintVisible) setHintVisible(false);
  }, [enabled, hintVisible]);

  return (
    <View style={styles.dividerContainer}>
      {/* Single full-width line spanning the whole screen behind the cluster
          (Issue 2 — no gap between the buttons). It's absolutely positioned at
          the container's vertical midpoint; the cluster below renders on top. */}
      <View style={styles.line} />

      <View style={styles.cluster}>
        <Pressable
          onPress={onPress}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel="Open menu: reset life or return home"
        >
          <LinearGradient
            colors={GRADIENTS.SILVER}
            style={styles.circleButton}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          >
            <MenuIcon stroke="white" />
          </LinearGradient>
        </Pressable>

        {/* End-game button is ALWAYS rendered. When something can be recorded
            it animates in + is interactive; otherwise it's dimmed and
            non-interactive for recording but still tappable to surface the
            hint (a Pressable above the dimmed gradient catches that tap). */}
        {enabled ? (
          <Animated.View style={{opacity: endGameOpacity, transform: [{scale: endGameScale}], marginLeft: 20}}>
            <Pressable
              onPress={onEndGame}
              hitSlop={HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel="End game and record outcome"
              accessibilityHint="Opens prompt to choose who won"
              accessibilityState={{disabled: false}}
            >
              <LinearGradient
                colors={GRADIENTS.SILVER}
                style={styles.circleButton}
                start={{x: 1, y: 0}}
                end={{x: 0, y: 1}}
              >
                <EndGameIcon stroke="white" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable
            onPress={showHint}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="End game (pick at least one real deck first)"
            accessibilityHint="Pick at least one real deck to record games"
            accessibilityState={{disabled: true}}
            style={styles.endGameDisabled}
          >
            <LinearGradient
              colors={GRADIENTS.SILVER}
              style={styles.circleButton}
              start={{x: 1, y: 0}}
              end={{x: 0, y: 1}}
            >
              <EndGameIcon stroke="white" />
            </LinearGradient>
          </Pressable>
        )}
      </View>

      {/* Transient discoverability hint — only shown after the user taps the
          disabled end-game button. Full-width absolute overlay so it centers
          under the cluster without disturbing the line or shifting the
          cluster (no layout shift in the steady state — it's not rendered at
          all when absent or when the control is enabled). */}
      {hintVisible && !enabled ? (
        <Text style={styles.hint} accessibilityRole="text">
          {HINT_TEXT}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dividerContainer: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    marginTop: -22
  },
  // Full-width unbroken line behind the cluster. Absolutely positioned at the
  // container's vertical center (the container is 44px tall — the button
  // height — so `top: 21` lands the 2px line on the midline). Spanning the
  // full width with the cluster drawn over it removes the old gap.
  line: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 21,
    height: 2,
    backgroundColor: "#ccc",
    // `pointerEvents` as a STYLE prop (not the deprecated View prop) so the
    // line never intercepts taps meant for the buttons over it.
    pointerEvents: "none"
  },
  cluster: {
    flexDirection: "row",
    alignItems: "center",
    // Translucent backdrop so the continuous line reads as passing *behind*
    // the buttons rather than visually intersecting the icons between them.
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 26,
    paddingHorizontal: 10
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 2,
    padding: 4
  },
  // Disabled end-game treatment: dimmed but still in the layout at the same
  // 20px gap so the reset pressable is not re-centered (design.md Decision 10).
  endGameDisabled: {
    opacity: 0.4,
    marginLeft: 20
  },
  // Full-width absolute overlay so the one-line hint centers under the
  // 44px button cluster (the cluster sits at the vertical midpoint of the
  // divider container; `top: 52` clears it).
  hint: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontFamily: "FiraCode_400Regular",
    fontSize: 11,
    ...textShadow({color: "rgba(0,0,0,0.6)", offset: {width: 0, height: 1}, radius: 4})
  }
});
