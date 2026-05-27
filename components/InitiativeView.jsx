import React, {useRef} from "react";
import {Platform, View, StyleSheet, Pressable, Animated, Image} from "react-native";
import {LinearGradient} from "expo-linear-gradient";

// react-native-web logs a "native animated module is missing" warning whenever
// useNativeDriver is true. Use the native driver only on real native platforms.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

export default function InitiativeView({hasInitiative, claimInitiative, initiativeImage, isLandscape = false, enableAnimations = true}) {
  const borderShineAnim = useRef(new Animated.Value(0)).current;
  // When animations are off, run the same sequence with duration 0 so the
  // scale/opacity transition is instantaneous (matches PlayerView's pattern).
  const shineDuration = enableAnimations ? 250 : 0;
  const triggerBorderAnimation = () => {
    Animated.sequence([
      Animated.timing(borderShineAnim, {
        toValue: 1,
        duration: shineDuration,
        useNativeDriver: USE_NATIVE_DRIVER
      }),
      Animated.timing(borderShineAnim, {
        toValue: 0,
        duration: shineDuration,
        useNativeDriver: USE_NATIVE_DRIVER
      })
    ]).start();
  };

  return (
    <Pressable
      style={[styles.initiativeArea, isLandscape ? styles.initiativeAreaLandscape : styles.initiativeAreaPortrait, hasInitiative && styles.initiativeTaken]}
      onPress={() => {
        if (!hasInitiative) {
          claimInitiative();
          triggerBorderAnimation();
        }
      }}
    >
      <Animated.View
        style={[
          styles.initiativeContainer,
          {
            transform: [
              {
                scale: borderShineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1]
                })
              }
            ],
            opacity: borderShineAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.8]
            })
          }
        ]}
      >
        <LinearGradient colors={["#a1a1a1", "#6e6e6e", "#a1a1a1"]} style={styles.initiativeBorder}>
          <View style={styles.initiativeIconWrapper}>
            <Image source={initiativeImage} resizeMode={isLandscape ? "center" : "cover"} style={styles.initiativeIcon} />
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  initiativeArea: {
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.2
  },
  initiativeAreaPortrait: {
    height: "20%"
  },
  initiativeAreaLandscape: {
    height: "30%"
  },
  initiativeTaken: {
    opacity: 1
  },
  initiativeContainer: {
    width: "60%",
    height: "60%",
    borderRadius: 9999,
    overflow: "hidden"
  },
  initiativeBorder: {
    width: "100%",
    height: "100%",
    borderRadius: 9999,
    padding: 4,
    overflow: "hidden"
  },
  initiativeIconWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 9999,
    overflow: "hidden"
  },
  initiativeIcon: {
    width: "100%",
    height: "100%"
  }
});
