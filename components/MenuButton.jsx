import React from "react";
import {Pressable, StyleSheet, Text} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {textShadow} from "../utils/textShadow";

export default function MenuButton({label, onPress, accessibilityLabel}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({pressed}) => [styles.pressable, pressed && styles.pressed]}
    >
      <LinearGradient colors={["#3c3c3c", "#6e6e6e", "#a1a1a1", "#6e6e6e", "#3c3c3c"]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.gradient}>
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
    minHeight: 56,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#cccccc55"
  },
  pressed: {
    opacity: 0.85
  },
  gradient: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  label: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 18,
    letterSpacing: 1.5,
    ...textShadow({color: "rgba(0,0,0,0.5)", offset: {width: 0, height: 2}, radius: 4})
  }
});
