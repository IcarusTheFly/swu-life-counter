import React from "react";
import {SafeAreaProvider, useSafeAreaInsets} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import {useKeepAwake} from "expo-keep-awake";
import {View, StyleSheet} from "react-native";

export default function ScreenLayout({children}) {
  React.useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");
  }, []);

  useKeepAwake();

  return (
    <SafeAreaProvider>
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
