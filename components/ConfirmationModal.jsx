import React from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {textShadow} from "../utils/textShadow";

const VARIANT_COLORS = {
  destructive: "#8B0000",
  primary: "#4B79A1",
  neutral: "#555555"
};

export default function ConfirmationModal({visible = false, title = "", actions = []}) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.modalOverlay}>
      <LinearGradient colors={["#3c3c3c", "#6e6e6e", "#3c3c3c"]} style={styles.dialog} start={{x: 1, y: 0}} end={{x: 0, y: 1}}>
        {title ? <Text style={styles.dialogTitle}>{title}</Text> : null}
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
    width: "85%",
    maxWidth: 420,
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
