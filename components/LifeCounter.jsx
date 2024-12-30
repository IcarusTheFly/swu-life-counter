import React, {useState} from "react";
import {View, StyleSheet} from "react-native";
import PlayerView from "./PlayerView";
import Divider from "./Divider";
import ConfirmationModal from "./ConfirmationModal";

export default function LifeCounter() {
  const player1ID = 1;
  const player2ID = 2;
  const [player1Life, setPlayer1Life] = useState(30);
  const [player2Life, setPlayer2Life] = useState(30);
  const [initiativePlayer, setInitiativePlayer] = useState(player2ID);
  const [dialogVisible, setDialogVisible] = useState(false);

  const resetApp = () => {
    setInitiativePlayer(player2ID);
    setPlayer1Life(30);
    setPlayer2Life(30);
    setDialogVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Opponent's view (inverted) */}
      {/* <LinearGradient colors={["#B22222", "#FF6347", "#8B0000"]} style={[styles.player, styles.opponent]}> */}
      <PlayerView
        hasInitiative={initiativePlayer === player1ID}
        playerLife={player1Life}
        setPlayerLife={setPlayer1Life}
        claimInitiative={() => setInitiativePlayer(player1ID)}
        backgroundImage={require("../assets/bg-space-opponent.png")}
        initiativeImage={require("../assets/initiative-icon.png")}
        isOpponent={true}
      />

      {/* Divider and Reset button */}
      <Divider onPress={() => setDialogVisible(true)} />

      {/* Dialog */}
      <ConfirmationModal visible={dialogVisible} onPressYes={resetApp} onPressNo={() => setDialogVisible(false)} />

      {/* Your view */}
      {/* <LinearGradient colors={["#1B1F3B", "#4B79A1", "#283E51"]} style={[styles.player, styles.user]}> */}
      <PlayerView
        hasInitiative={initiativePlayer === player2ID}
        playerLife={player2Life}
        setPlayerLife={setPlayer2Life}
        claimInitiative={() => setInitiativePlayer(player2ID)}
        backgroundImage={require("../assets/bg-space-player.png")}
        initiativeImage={require("../assets/initiative-icon.png")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
    // backgroundColor: "#f0f0f0"
  }
});
