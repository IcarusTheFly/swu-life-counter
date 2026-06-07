import React from "react";
import {Pressable, StyleSheet, Text, View, useWindowDimensions} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import HomeIcon from "../icons/HomeIcon";
import DeckIcon from "../icons/DeckIcon";
import GearIcon from "../icons/GearIcon";
import {METAL, TEXT} from "../constants/theme";

// Dark-tinted icons on the brushed-silver bar (metallic-design-system). Active
// is the high-contrast dark tone + a matching dark indicator; inactive is muted.
const ACTIVE = TEXT.onMetal.primary;
const INACTIVE = TEXT.onMetal.muted;

const TABS = [
  {key: "home", label: "Home", Icon: HomeIcon},
  {key: "decks", label: "Decks", Icon: DeckIcon},
  {key: "settings", label: "Settings", Icon: GearIcon}
];

// Persistent bottom tab bar (bottom-nav-and-dashboard). Drives App's `screen`
// state directly — no router. `active` is the active tab key; `onNavigate(key)`
// switches to that destination. A metallic silver surface that reads as part of
// the design system; clears the OS bottom inset (home indicator / gesture bar).
export default function BottomTabBar({active, onNavigate}) {
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const landscape = width > height;
  return (
    <LinearGradient
      colors={METAL.surface}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={[styles.bar, landscape && styles.barCompact, {paddingBottom: Math.max(insets.bottom, landscape ? 4 : 8)}]}
    >
      {TABS.map(({key, label, Icon}) => {
        const isActive = active === key;
        const color = isActive ? ACTIVE : INACTIVE;
        return (
          <Pressable
            key={key}
            onPress={() => onNavigate(key)}
            style={[styles.tab, landscape && styles.tabCompact]}
            accessibilityRole="button"
            accessibilityState={{selected: isActive}}
            accessibilityLabel={label}
          >
            {isActive ? <View style={[styles.activeBar, landscape && styles.activeBarCompact]} /> : null}
            <Icon color={color} size={landscape ? 19 : 22} />
            <Text style={[styles.label, landscape && styles.labelCompact, {color}]}>{label}</Text>
          </Pressable>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: METAL.bevelLight,
    paddingTop: 9
  },
  barCompact: {paddingTop: 5},
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 48,
    position: "relative"
  },
  tabCompact: {minHeight: 32, gap: 2},
  label: {
    fontFamily: "FiraCode_700Bold",
    fontSize: 10,
    letterSpacing: 0.5
  },
  labelCompact: {fontSize: 9},
  activeBar: {
    position: "absolute",
    top: -9,
    height: 2.5,
    width: 44,
    borderRadius: 1,
    backgroundColor: ACTIVE
  },
  activeBarCompact: {top: -5, height: 2}
});
