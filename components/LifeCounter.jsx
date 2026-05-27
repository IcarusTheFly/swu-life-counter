import React, {useCallback, useEffect, useMemo, useState} from "react";
import {BackHandler, Platform, StyleSheet, View, useWindowDimensions} from "react-native";
import PlayerView from "./PlayerView";
import Divider from "./Divider";
import ConfirmationModal from "./ConfirmationModal";
import {useSettings} from "../context/SettingsContext";
import {TEAM_COLORS} from "../constants/teamColors";

const PLAYER1_ID = 1;
const PLAYER2_ID = 2;

export default function LifeCounter({onReturnHome}) {
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const {settings} = useSettings();

  // Snapshot settings at game start — mid-game changes are not possible (Settings is only
  // reachable from Home), so this is purely about making reset deterministic.
  const startConfig = useMemo(
    () => ({
      initialLife: settings.initialLife,
      player1Color: TEAM_COLORS[settings.player1Color] || TEAM_COLORS.green,
      player2Color: TEAM_COLORS[settings.player2Color] || TEAM_COLORS.red,
      enableAnimations: settings.enableAnimations,
      enableHaptics: settings.enableHaptics
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [player1Life, setPlayer1Life] = useState(startConfig.initialLife);
  const [player2Life, setPlayer2Life] = useState(startConfig.initialLife);
  const [initiativePlayer, setInitiativePlayer] = useState(PLAYER2_ID);
  const [dialogVisible, setDialogVisible] = useState(false);

  const resetLife = useCallback(() => {
    setInitiativePlayer(PLAYER2_ID);
    setPlayer1Life(startConfig.initialLife);
    setPlayer2Life(startConfig.initialLife);
    setDialogVisible(false);
  }, [startConfig.initialLife]);

  const returnHome = useCallback(() => {
    setDialogVisible(false);
    onReturnHome && onReturnHome();
  }, [onReturnHome]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (dialogVisible) {
        setDialogVisible(false);
        return true;
      }
      returnHome();
      return true;
    });
    return () => sub.remove();
  }, [dialogVisible, returnHome]);

  return (
    <View style={styles.container}>
      <PlayerView
        hasInitiative={initiativePlayer === PLAYER1_ID}
        playerLife={player1Life}
        setPlayerLife={setPlayer1Life}
        claimInitiative={() => setInitiativePlayer(PLAYER1_ID)}
        backgroundImage={isLandscape ? startConfig.player1Color.bg.landscape : startConfig.player1Color.bg.portrait}
        initiativeImage={require("../assets/initiative-icon.png")}
        isOpponent={true}
        isLandscape={isLandscape}
        teamColor={startConfig.player1Color}
        enableAnimations={startConfig.enableAnimations}
        enableHaptics={startConfig.enableHaptics}
      />

      <Divider onPress={() => setDialogVisible(true)} />

      <ConfirmationModal
        visible={dialogVisible}
        title="Reset life or return to home?"
        actions={[
          {label: "Reset Life", variant: "destructive", onPress: resetLife},
          {label: "Return to Home", variant: "primary", onPress: returnHome},
          {label: "Cancel", variant: "neutral", onPress: () => setDialogVisible(false)}
        ]}
      />

      <PlayerView
        hasInitiative={initiativePlayer === PLAYER2_ID}
        playerLife={player2Life}
        setPlayerLife={setPlayer2Life}
        claimInitiative={() => setInitiativePlayer(PLAYER2_ID)}
        backgroundImage={isLandscape ? startConfig.player2Color.bg.landscape : startConfig.player2Color.bg.portrait}
        initiativeImage={require("../assets/initiative-icon.png")}
        isLandscape={isLandscape}
        teamColor={startConfig.player2Color}
        enableAnimations={startConfig.enableAnimations}
        enableHaptics={startConfig.enableHaptics}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
