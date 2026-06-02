import React from "react";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import {useKeepAwake} from "expo-keep-awake";
import {Platform, View, StyleSheet} from "react-native";
import SpaceBackground from "./SpaceBackground";
import {SPACE_BASE} from "../constants/theme";

// expo-keep-awake on web calls `navigator.wakeLock.request("screen")`
// immediately on mount. Browsers reject the request with a
// `NotAllowedError: The requesting page is not visible` whenever the
// document isn't visible at that moment (e.g. background tab on launch).
// The wake-lock benefit is also pretty marginal on a desktop browser —
// users aren't worried about their monitor sleeping mid-game. So we only
// activate it on real native platforms.
function KeepAwakeOnNative() {
  useKeepAwake();
  return null;
}

export default function ScreenLayout({children}) {
  React.useEffect(() => {
    // expo-navigation-bar is Android-only; calling it on iOS/web warns and is a no-op.
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
    }
  }, []);

  return (
    <SafeAreaProvider>
      {Platform.OS !== "web" && <KeepAwakeOnNative />}
      <ScreenContent>{children}</ScreenContent>
    </SafeAreaProvider>
  );
}

const ScreenContent = ({children}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar hidden={true} />
      {/* Global animated space backdrop — full-bleed, behind ALL content. It's
          rendered first (and absolutely filled) so the in-flow content below
          paints on top of it; screens keep transparent roots so it shows
          through. */}
      <SpaceBackground />
      <View style={[styles.content, {paddingTop: insets.top}]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Solid space-base fallback so there's never a black/white flash before the
    // backdrop's gradient paints.
    backgroundColor: SPACE_BASE
  },
  content: {
    flex: 1,
    backgroundColor: "transparent"
  }
});
