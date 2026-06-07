import React from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import HomeIcon from "../icons/HomeIcon";
import DeckIcon from "../icons/DeckIcon";
import GearIcon from "../icons/GearIcon";

const ACTIVE = "#e8e8ee";
const INACTIVE = "#6f727a";

const TABS = [
  {key: "home", label: "Home", Icon: HomeIcon},
  {key: "decks", label: "Decks", Icon: DeckIcon},
  {key: "settings", label: "Settings", Icon: GearIcon}
];

// Persistent bottom tab bar (bottom-nav-and-dashboard). Drives App's `screen`
// state directly — no router. `active` is the active tab key; `onNavigate(key)`
// switches to that destination. Opaque surface so it reads cleanly over the
// space backdrop; clears the OS bottom inset (home indicator / gesture bar).
export default function BottomTabBar({active, onNavigate}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, {paddingBottom: Math.max(insets.bottom, 8)}]}>
      {TABS.map(({key, label, Icon}) => {
        const isActive = active === key;
        const color = isActive ? ACTIVE : INACTIVE;
        return (
          <Pressable
            key={key}
            onPress={() => onNavigate(key)}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={{selected: isActive}}
            accessibilityLabel={label}
          >
            {isActive ? <View style={styles.activeBar} /> : null}
            <Icon color={color} size={22} />
            <Text style={[styles.label, {color}]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: "#0b0b0d",
    borderTopWidth: 1,
    borderTopColor: "#1f1f24",
    paddingTop: 9
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 48,
    position: "relative"
  },
  label: {
    fontFamily: "FiraCode_700Bold",
    fontSize: 10,
    letterSpacing: 0.5
  },
  activeBar: {
    position: "absolute",
    top: -9,
    height: 2,
    width: 30,
    borderRadius: 1,
    backgroundColor: ACTIVE
  }
});
