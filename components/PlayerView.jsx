import React, {useState, useRef} from "react";
import {View, Text, StyleSheet, Pressable, ImageBackground, Animated} from "react-native";
import {useFonts, SpaceMono_400Regular, SpaceMono_700Bold} from "@expo-google-fonts/space-mono";

export default function PlayerView({hasInitiative, claimInitiative, backgroundImage, isOpponent = false}) {
  useFonts({
    SpaceMono_400Regular,
    SpaceMono_700Bold
  });

  const [playerLife, setPlayerLife] = useState(30);
  const [lifeChange, setLifeChange] = useState(null);

  const [didFadeIn, setDidFadeIn] = useState(false);
  const fadeOutTimeout = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;

  const updateLife = (change) => {
    if ((change > 0 && playerLife < 99) || (change < 0 && playerLife > -9)) {
      clearTimeout(fadeOutTimeout.current);

      setPlayerLife((prevLife) => prevLife + change);
      setLifeChange(lifeChange + change);

      if (!didFadeIn) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          })
        ]).start();
        setDidFadeIn(true);
      }

      fadeOutTimeout.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        }).start(() => {
          setLifeChange(null);
          setDidFadeIn(false);
        });
      }, 2000);
    }
  };

  return (
    <ImageBackground source={backgroundImage} resizeMode="cover" style={[styles.player, isOpponent && styles.opponent]}>
      {/* Life Change Indicator */}
      {lifeChange !== null && (
        <View style={styles.lifeChangeContent}>
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

      {/* Life Points */}
      <View style={styles.lifeArea}>
        <Pressable style={({pressed}) => [styles.buttonContainer, pressed && (isOpponent ? styles.pressedButtonContainerOpponent : styles.pressedButtonContainer)]} onPress={() => updateLife(-1)}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>-</Text>
          </View>
        </Pressable>
        <View style={styles.buttonContainer}>
          <Text style={styles.lifeText}>{playerLife}</Text>
        </View>
        <Pressable style={({pressed}) => [styles.buttonContainer, pressed && (isOpponent ? styles.pressedButtonContainerOpponent : styles.pressedButtonContainer)]} onPress={() => updateLife(1)}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>+</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.divider} />

      {/* Initiative */}
      <Pressable style={[styles.initiativeArea, hasInitiative && styles.initiativeTaken]} onPress={() => !hasInitiative && claimInitiative()}>
        <Text style={[styles.initiativeText, hasInitiative && styles.initiativeTaken]}>{!hasInitiative ? "CLAIM INITIATIVE" : "You have the initiative"}</Text>
      </Pressable>
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
    // backgroundColor: "#8B0000",
    transform: [{rotate: "180deg"}]
  },
  lifeChangeContent: {
    alignItems: "center",
    zIndex: 10
  },
  lifeChangeText: {
    position: "absolute",
    top: 20,
    fontSize: 26,
    color: "white",
    opacity: 0.6,
    textShadowColor: "black",
    textShadowOffset: {
      width: 0,
      height: 2
    },
    textShadowRadius: 6,
    textShadowOpacity: 0.1
  },
  lifeArea: {
    height: "75%",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    flexDirection: "row"
  },
  initiativeArea: {
    height: "20%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row"
  },
  initiativeTaken: {
    fontSize: 24,
    backgroundColor: "#FFF",
    color: "black"
  },
  initiativeText: {
    fontSize: 36,
    fontFamily: "SpaceMono_400Regular",
    fontWeight: "bold",
    color: "white"
  },
  lifeText: {
    fontWeight: "bold",
    color: "white",
    marginVertical: 10,
    fontFamily: "SpaceMono_400Regular",
    fontSize: 100,
    textShadowColor: "black",
    textShadowOffset: {
      width: 0,
      height: 2
    },
    textShadowRadius: 6,
    textShadowOpacity: 0.1
  },
  buttonContainer: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  pressedButtonContainerOpponent: {
    backgroundColor: "#FF6347",
    opacity: 0.5
  },
  pressedButtonContainer: {
    backgroundColor: "#4B79A1",
    opacity: 0.5
  },
  button: {
    // backgroundColor: "#4CAF50",
    padding: 5,
    marginHorizontal: 5,
    borderRadius: 5,
    borderColor: "white",
    borderWidth: 4,
    borderStyle: "dotted"
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontFamily: "SpaceMono_400Regular",
    fontSize: 100,
    textShadowColor: "black",
    textShadowOffset: {
      width: 0,
      height: 2
    },
    textShadowRadius: 6,
    textShadowOpacity: 0.1
  },
  divider: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#FFF",
    borderStyle: "dashed"
  }
});
