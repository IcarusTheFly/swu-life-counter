import React, {useCallback, useState} from "react";
import {useFonts, FiraCode_400Regular, FiraCode_700Bold} from "@expo-google-fonts/fira-code";
import ScreenLayout from "./components/ScreenLayout";
import HomeScreen from "./components/HomeScreen";
import SettingsScreen from "./components/SettingsScreen";
import LifeCounter from "./components/LifeCounter";
import {SettingsProvider} from "./context/SettingsContext";

export default function App() {
  const [fontsLoaded] = useFonts({FiraCode_400Regular, FiraCode_700Bold});
  const [screen, setScreen] = useState("home");

  const goHome = useCallback(() => setScreen("home"), []);
  const goGame = useCallback(() => setScreen("game"), []);
  const goSettings = useCallback(() => setScreen("settings"), []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SettingsProvider>
      <ScreenLayout>
        {screen === "home" && <HomeScreen onStartGame={goGame} onOpenSettings={goSettings} />}
        {screen === "settings" && <SettingsScreen onBack={goHome} />}
        {screen === "game" && <LifeCounter onReturnHome={goHome} />}
      </ScreenLayout>
    </SettingsProvider>
  );
}
