import React, {useRef} from "react";
import {View, StyleSheet, Pressable, Animated, Image} from "react-native";
import {LinearGradient} from "expo-linear-gradient";

export default function InitiativeView({hasInitiative, claimInitiative, initiativeImage}) {
  const borderShineAnim = useRef(new Animated.Value(0)).current;
  const triggerBorderAnimation = () => {
    Animated.sequence([
      Animated.timing(borderShineAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(borderShineAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      })
    ]).start();
  };

  return (
    <Pressable
      style={[styles.initiativeArea, hasInitiative && styles.initiativeTaken]}
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
            <Image source={initiativeImage} style={styles.initiativeIcon} />
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  initiativeArea: {
    height: "20%",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.2
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
    height: "100%",
    resizeMode: "cover"
  }
});
