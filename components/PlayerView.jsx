import React, {useState, useRef} from "react";
import {Platform, View, Text, StyleSheet, Pressable, ImageBackground, Animated} from "react-native";
import * as Haptics from "expo-haptics";
import InitiativeView from "./InitiativeView";
import {canUpdateLife} from "./lifeMath";
import {textShadow} from "../utils/textShadow";

// react-native-web has no native animated module; only request native driver on real platforms.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

// Haptic feedback is mobile-only — expo-haptics ships a web no-op but we still
// gate the call so the import path is dormant on web.
const HAPTICS_AVAILABLE = Platform.OS !== "web";

export default function PlayerView({
  hasInitiative,
  claimInitiative,
  backgroundImage,
  initiativeImage,
  playerLife,
  setPlayerLife,
  isOpponent = false,
  isLandscape = false,
  teamColor,
  enableAnimations = true,
  enableHaptics = false
}) {
  const [lifeChange, setLifeChange] = useState(null);

  const [didFadeIn, setDidFadeIn] = useState(false);
  const fadeOutTimeout = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;

  const pressTint = teamColor ? teamColor.press : "#FFFFFF33";

  // When animations are off, run the same Animated.timing calls but with
  // duration: 0 so the overlay snaps in/out — feedback is preserved, motion
  // is removed (see design.md Decision 5).
  const fadeInDuration = enableAnimations ? 300 : 0;
  const fadeOutDuration = enableAnimations ? 500 : 0;

  const updateLife = (change) => {
    if (canUpdateLife(playerLife, change)) {
      clearTimeout(fadeOutTimeout.current);

      if (enableHaptics && HAPTICS_AVAILABLE) {
        // Fire-and-forget; the promise rejection (e.g. user denied haptics
        // permission on iOS) is harmless and not worth surfacing.
        Haptics.selectionAsync().catch(() => {});
      }

      setPlayerLife((prevLife) => prevLife + change);
      setLifeChange((prev) => (prev || 0) + change);

      if (!didFadeIn) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: fadeInDuration,
            useNativeDriver: USE_NATIVE_DRIVER
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: fadeInDuration,
            useNativeDriver: USE_NATIVE_DRIVER
          })
        ]).start();
        setDidFadeIn(true);
      }

      fadeOutTimeout.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: fadeOutDuration,
          useNativeDriver: USE_NATIVE_DRIVER
        }).start(() => {
          setLifeChange(null);
          setDidFadeIn(false);
        });
      }, 2000);
    }
  };

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={[styles.player, isOpponent && styles.opponent]}>
      {lifeChange !== null && (
        <View style={[styles.lifeChangeContent, isLandscape ? styles.lifeChangeContentLandscape : styles.lifeChangeContentPortrait]}>
          <Animated.Text
            style={[
              styles.lifeChangeText,
              {
                opacity: fadeAnim,
                transform: [{translateY: translateYAnim}]
              }
            ]}
          >
            {lifeChange > 0 ? `+${lifeChange}` : lifeChange}
          </Animated.Text>
        </View>
      )}

      <View style={styles.lifeArea}>
        <Pressable style={({pressed}) => [styles.buttonContainer, pressed && {backgroundColor: pressTint}]} onPress={() => updateLife(-1)}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>-</Text>
          </View>
        </Pressable>
        <View style={styles.buttonContainer}>
          <Text style={styles.lifeText}>{playerLife}</Text>
        </View>
        <Pressable style={({pressed}) => [styles.buttonContainer, pressed && {backgroundColor: pressTint}]} onPress={() => updateLife(1)}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>+</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <InitiativeView hasInitiative={hasInitiative} claimInitiative={claimInitiative} initiativeImage={initiativeImage} isLandscape={isLandscape} enableAnimations={enableAnimations} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  player: {
    width: "100%",
    height: "100%",
    flex: 1,
    flexDirection: "column"
  },
  opponent: {
    transform: [{rotate: "180deg"}]
  },
  lifeChangeContent: {
    zIndex: 2
  },
  lifeChangeContentPortrait: {
    alignItems: "center"
  },
  lifeChangeContentLandscape: {
    alignItems: "flex-end",
    marginRight: "35%"
  },
  lifeChangeText: {
    position: "absolute",
    top: 35,
    fontSize: 26,
    color: "white",
    opacity: 0.6,
    // `textShadowOpacity` isn't a valid RN style prop — the intent was a faint shadow,
    // expressed correctly by baking the opacity into the rgba color below.
    ...textShadow({color: "rgba(0,0,0,0.1)", offset: {width: 0, height: 2}, radius: 6})
  },
  lifeArea: {
    height: "75%",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    flexDirection: "row"
  },
  lifeText: {
    fontWeight: "bold",
    color: "white",
    marginVertical: 10,
    fontFamily: "FiraCode_400Regular",
    fontSize: 100,
    ...textShadow({color: "rgba(0,0,0,0.1)", offset: {width: 0, height: 2}, radius: 6})
  },
  buttonContainer: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  button: {
    padding: 5,
    marginHorizontal: 5
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontFamily: "FiraCode_400Regular",
    fontSize: 100,
    ...textShadow({color: "rgba(0,0,0,0.1)", offset: {width: 0, height: 2}, radius: 6})
  },
  divider: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#FFF",
    borderStyle: "dashed"
  }
});
