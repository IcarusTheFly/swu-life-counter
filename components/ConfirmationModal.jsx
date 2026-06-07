import React, {useEffect, useRef} from "react";
import {Animated, Platform, Pressable, StyleSheet, Text, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {textShadow} from "../utils/textShadow";
import {GRADIENTS} from "../constants/theme";
import {animatedDuration} from "../utils/animation";

// react-native-web has no native animated module; mirror PlayerView's gate.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

// Metallic button language (modernize-ui): affirmative/player → silver,
// opponent → gold (matching the Player=silver / Opponent=gold convention used
// by the deck default buttons), destructive → metallic crimson, neutral/cancel
// → dark steel. The `variant` API is unchanged, so every caller upgrades.
const VARIANT_GRADIENTS = {
  primary: GRADIENTS.SILVER,
  player: GRADIENTS.SILVER,
  opponent: GRADIENTS.GOLD,
  // "Draw" — a cool slate-blue, distinct from the neutral/cancel steel.
  draw: ["#243042", "#3f5774", "#243042"],
  destructive: GRADIENTS.CRIMSON,
  neutral: GRADIENTS.STEEL
};
const VARIANT_TEXT = {
  primary: "#FFFFFF",
  player: "#FFFFFF",
  opponent: "#241a04", // dark text on bright gold (matches DeckDetail's gold button)
  draw: "#dfe7f0",
  destructive: "#ffdada",
  neutral: "#d0d0d0"
};

// Shared confirmation dialog. Used by the reset modal in LifeCounter, the
// game-end outcome modal, and the deck-delete prompt on DeckDetailScreen.
//
// Animation note (design.md Decision 11, arbitration 2): when `visible`
// transitions to true the dialog fades + scales in over 180ms. Gated on
// `enableAnimations` so the global animations toggle silences it (the
// helper still runs Animated.timing with `duration: 0` — same pattern as
// PlayerView so we keep one code path).
export default function ConfirmationModal({visible = false, title = "", message = "", actions = [], enableAnimations = true}) {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      // Reset to the start state for the next entry. Doing this in an
      // effect (vs imperatively in a render branch) keeps the Animated
      // values out of React's render path.
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
      return;
    }
    const duration = animatedDuration(180, enableAnimations);
    Animated.parallel([
      Animated.timing(scaleAnim, {toValue: 1, duration, useNativeDriver: USE_NATIVE_DRIVER}),
      Animated.timing(opacityAnim, {toValue: 1, duration, useNativeDriver: USE_NATIVE_DRIVER})
    ]).start();
  }, [visible, enableAnimations, scaleAnim, opacityAnim]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.modalOverlay}>
      <Animated.View style={{opacity: opacityAnim, transform: [{scale: scaleAnim}], width: "85%", maxWidth: 420}}>
        <LinearGradient colors={["#3c3c3c", "#6e6e6e", "#3c3c3c"]} style={styles.dialog} start={{x: 1, y: 0}} end={{x: 0, y: 1}}>
          {title ? <Text style={styles.dialogTitle}>{title}</Text> : null}
          {message ? <Text style={styles.dialogMessage}>{message}</Text> : null}
          <View style={styles.dialogActions}>
            {actions.map((action, idx) => {
              // A per-action `colors` (gradient array) + `textColor` override
              // the variant defaults — used for the team-colored win buttons.
              const colors = action.colors || VARIANT_GRADIENTS[action.variant] || VARIANT_GRADIENTS.neutral;
              const textColor = action.textColor || VARIANT_TEXT[action.variant] || VARIANT_TEXT.neutral;
              return (
                <Pressable
                  key={(action.accessibilityLabel || action.label) + "-" + idx}
                  style={({pressed}) => [styles.dialogButton, pressed && styles.dialogButtonPressed]}
                  onPress={action.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={action.accessibilityLabel || action.label}
                >
                  <LinearGradient colors={colors} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.dialogButtonGradient}>
                    <Text style={[styles.dialogButtonText, {color: textColor}]}>{action.label}</Text>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3
  },
  dialog: {
    width: "100%",
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 2,
    padding: 20,
    alignItems: "center",
    elevation: 5
  },
  dialogTitle: {
    fontSize: 20,
    color: "white",
    ...textShadow({color: "black", offset: {width: 0, height: 1}, radius: 0}),
    textAlign: "center",
    marginBottom: 15
  },
  dialogMessage: {
    fontSize: 14,
    color: "#EEE",
    textAlign: "center",
    // Span the dialog's inner width so long messages wrap within it instead of
    // pushing past the edges.
    alignSelf: "stretch",
    marginTop: -8,
    marginBottom: 16,
    fontFamily: "FiraCode_400Regular",
    letterSpacing: 0.3,
    lineHeight: 20
  },
  dialogActions: {
    flexDirection: "column",
    width: "100%",
    gap: 10
  },
  dialogButton: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    minHeight: 44
  },
  dialogButtonPressed: {
    opacity: 0.8
  },
  dialogButtonGradient: {
    width: "100%",
    paddingVertical: 11,
    paddingHorizontal: 14,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center"
  },
  dialogButtonText: {
    fontWeight: "bold",
    ...textShadow({color: "rgba(0,0,0,0.6)", offset: {width: 0, height: 1}, radius: 2}),
    fontSize: 16,
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 21
  }
});
