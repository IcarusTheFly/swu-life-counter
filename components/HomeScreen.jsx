import React from "react";
import {BackHandler, Platform, StyleSheet, Text, View} from "react-native";
import MenuButton from "./MenuButton";
import {textShadow} from "../utils/textShadow";

// Exit is hidden on iOS where Apple HIG forbids programmatic termination.
// Shown on Android (BackHandler.exitApp) and web (window.close, which may
// no-op in browsers if the tab wasn't script-opened — harmless).
const SHOW_EXIT = Platform.OS !== "ios";

function handleExit() {
  if (Platform.OS === "android") {
    BackHandler.exitApp();
  } else if (Platform.OS === "web" && typeof window !== "undefined") {
    window.close();
  }
}

export default function HomeScreen({onStartGame, onOpenSettings}) {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Text style={styles.title}>SWU LIFE COUNTER</Text>
        <Text style={styles.subtitle}>STAR WARS UNLIMITED</Text>
      </View>

      <View style={styles.menuWrap}>
        <View style={styles.menu}>
          <MenuButton label="Start Game" onPress={onStartGame} />
          <MenuButton label="Settings" onPress={onOpenSettings} />
          {SHOW_EXIT ? <MenuButton label="Exit" onPress={handleExit} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32
  },
  brand: {
    alignItems: "center",
    paddingTop: 24
  },
  title: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 24,
    letterSpacing: 1.4,
    ...textShadow({color: "rgba(0,0,0,0.6)", offset: {width: 0, height: 2}, radius: 6})
  },
  subtitle: {
    color: "#888",
    fontFamily: "FiraCode_400Regular",
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 6
  },
  menuWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  menu: {
    width: "100%",
    maxWidth: 360,
    gap: 18
  }
});
