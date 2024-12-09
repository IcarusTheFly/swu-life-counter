import React, {useState} from "react";
import {View, StyleSheet} from "react-native";
import {useFonts, SpaceMono_400Regular, SpaceMono_700Bold} from "@expo-google-fonts/space-mono";
import PlayerView from "./PlayerView";

export default function LifeCounter() {
  useFonts({
    SpaceMono_400Regular,
    SpaceMono_700Bold
  });

  const player1ID = 1;
  const player2ID = 2;
  const [initiativePlayer, setInitiativePlayer] = useState(player2ID);

  return (
    <View style={styles.container}>
      {/* Opponent's view (inverted) */}
      {/* <LinearGradient colors={["#B22222", "#FF6347", "#8B0000"]} style={[styles.player, styles.opponent]}> */}
      <PlayerView
        hasInitiative={initiativePlayer === player1ID}
        claimInitiative={() => setInitiativePlayer(player1ID)}
        backgroundImage={require("../assets/bg-gradient-opponent.png")}
        isOpponent={true}
      />

      <View style={styles.divider} />

      {/* Your view */}
      {/* <LinearGradient colors={["#1B1F3B", "#4B79A1", "#283E51"]} style={[styles.player, styles.user]}> */}
      <PlayerView hasInitiative={initiativePlayer === player2ID} claimInitiative={() => setInitiativePlayer(player2ID)} backgroundImage={require("../assets/bg-gradient-player.png")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
    // backgroundColor: "#f0f0f0"
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#ccc"
  }
});
