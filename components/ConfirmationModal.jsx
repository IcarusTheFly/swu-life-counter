import React, {useEffect, useRef} from "react";
import {Animated, Platform, Pressable, StyleSheet, Text, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {textShadow} from "../utils/textShadow";

// react-native-web has no native animated module; mirror PlayerView's gate.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

const VARIANT_COLORS = {
  destructive: "#8B0000",
  primary: "#4B79A1",
  neutral: "#555555"
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
    const duration = enableAnimations ? 180 : 0;
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
              const tint = VARIANT_COLORS[action.variant] || VARIANT_COLORS.neutral;
              return (
                <Pressable key={action.label + idx} style={[styles.dialogButton, {backgroundColor: tint}]} onPress={action.onPress} accessibilityRole="button" accessibilityLabel={action.accessibilityLabel || action.label}>
                  <Text style={styles.dialogButtonText}>{action.label}</Text>
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
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center"
  },
  dialogButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    ...textShadow({color: "black", offset: {width: 0, height: 2}, radius: 0}),
    fontSize: 18
  }
});
