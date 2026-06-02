import React, {useEffect, useMemo, useRef} from "react";
import {Animated, Platform, Pressable, StyleSheet, Text, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {textShadow} from "../utils/textShadow";
import {SPACE_BUBBLE_GRADIENT} from "../constants/theme";
import {animatedDuration} from "../utils/animation";

// react-native-web has no native animated module; the project's standard gate.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

// Initiative control (modernize-ui redesign, v9). A small "closed" bubble
// spelling "INITIATIVE", with its own deep-space (indigo/violet) gradient fill.
//
// PLACEMENT: the bubble is centered within the RIGHT HALF of the player's area
// — i.e. its horizontal center sits at ~75% of the width. That keeps it clear
// of the bottom-LEFT deck badge AND well away from the screen edge (so the pop
// never lets the border touch the edge), at any size. (The opponent half's
// 180° rotation flips this consistently, so each player sees it the same way.)
//
// CLICK ANIMATION: when a side BECOMES claimed, the bubble grows oversize
// slowly then settles back over ~1.1s (scale 1 → 1.25 → 1). It's driven by the
// claim state-transition (survives the re-render) and is **gated on the
// "Enable animations" toggle** — when off the durations are 0 so the bubble
// just becomes claimed instantly, with no grow/settle.
//
// States: unclaimed = dimmed, grey text, faint border; claimed = the claiming
// side's TEAM COLOR for the text + the (single) border.
export default function InitiativeView({hasInitiative, claimInitiative, teamColor, isLandscape = false, enableAnimations = true}) {
  const pop = useRef(new Animated.Value(0)).current;
  const scale = useMemo(() => pop.interpolate({inputRange: [0, 1], outputRange: [1, 1.25]}), [pop]);
  const wasClaimed = useRef(hasInitiative);

  useEffect(() => {
    if (hasInitiative && !wasClaimed.current) {
      pop.stopAnimation();
      pop.setValue(0);
      Animated.sequence([
        Animated.timing(pop, {toValue: 1, duration: animatedDuration(600, enableAnimations), useNativeDriver: USE_NATIVE_DRIVER}),
        Animated.timing(pop, {toValue: 0, duration: animatedDuration(500, enableAnimations), useNativeDriver: USE_NATIVE_DRIVER})
      ]).start();
    }
    wasClaimed.current = hasInitiative;
  }, [hasInitiative, enableAnimations, pop]);

  const accent = (teamColor && teamColor.base) || "#cfcfd6";

  return (
    <View style={[styles.area, isLandscape ? styles.areaLandscape : styles.areaPortrait]}>
      {/* The bubble lives centered within the right 50% of the band. */}
      <View style={styles.rightHalf}>
        <Pressable
          onPress={() => {
            if (!hasInitiative) claimInitiative();
          }}
          accessibilityRole="button"
          accessibilityLabel={hasInitiative ? "You have initiative" : "Claim initiative"}
          accessibilityState={{selected: hasInitiative}}
        >
          <Animated.View style={[{transform: [{scale}]}, !hasInitiative && styles.dim]}>
            <LinearGradient
              colors={SPACE_BUBBLE_GRADIENT}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[styles.pill, {borderColor: hasInitiative ? accent : "rgba(255,255,255,0.3)"}]}
            >
              <Text
                style={[styles.label, isLandscape && styles.labelLandscape, {color: hasInitiative ? accent : "#b9b9c4"}]}
                numberOfLines={1}
              >
                INITIATIVE
              </Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full-width band; its single child (the right half) is pushed to the right.
  area: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center"
  },
  areaPortrait: {
    height: "20%"
  },
  areaLandscape: {
    height: "30%"
  },
  // The right 50% of the band — the bubble is centered inside it, so the
  // bubble's horizontal center lands at ~75% of the player area's width.
  rightHalf: {
    width: "50%",
    alignItems: "center",
    justifyContent: "center"
  },
  dim: {
    opacity: 0.5
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 5,
    minHeight: 28,
    overflow: "hidden"
  },
  label: {
    fontFamily: "FiraCode_700Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    ...textShadow({color: "rgba(0,0,0,0.7)", offset: {width: 0, height: 1}, radius: 3})
  },
  labelLandscape: {
    fontSize: 10,
    letterSpacing: 1
  }
});
