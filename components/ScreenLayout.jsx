import React from "react";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";

export default function ScreenLayout({children}) {
  React.useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar hidden={true} />
      {children}
    </SafeAreaProvider>
  );
}
