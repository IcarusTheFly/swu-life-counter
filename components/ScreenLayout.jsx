import React from "react";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import {useKeepAwake} from "expo-keep-awake";
import {Platform, View, StyleSheet} from "react-native";

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
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar hidden={true} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black"
  }
});
