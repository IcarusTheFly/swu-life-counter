import ScreenLayout from "./components/ScreenLayout";
import LifeCounter from "./components/LifeCounter";

import React, {useState, useEffect} from "react";
import * as Font from "expo-font";

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        FiraCode_400Regular: require("./assets/fonts/FiraCode-Regular.ttf"),
        FiraCode_700Bold: require("./assets/fonts/FiraCode-Bold.ttf")
      });
      setFontsLoaded(true);
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ScreenLayout>
      <LifeCounter />
    </ScreenLayout>
  );
}
