import React, {useEffect} from "react";
import {BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import BackIcon from "../icons/BackIcon";
import {useSettings} from "../context/SettingsContext";
import {STARTING_LIFE_MAX, STARTING_LIFE_MIN, STARTING_LIFE_PRESETS} from "../constants/settings";
import {TEAM_COLORS, TEAM_COLOR_KEYS} from "../constants/teamColors";
import {textShadow} from "../utils/textShadow";

export default function SettingsScreen({onBack}) {
  const {settings, updateSettings} = useSettings();

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const setPlayer1Color = (key) => updateSettings({player1Color: key});
  const setPlayer2Color = (key) => updateSettings({player2Color: key});
  const setLifeMode = (mode) => updateSettings({lifeMode: mode});

  const stepStartingLife = (delta) => {
    const next = Math.max(STARTING_LIFE_MIN, Math.min(STARTING_LIFE_MAX, settings.startingLife + delta));
    if (next !== settings.startingLife) {
      updateSettings({startingLife: next});
    }
  };

  const setStartingLife = (value) => updateSettings({startingLife: value});

  const showStartingLife = settings.lifeMode === "down";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={({pressed}) => [styles.backBtn, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Back to Home">
          <BackIcon stroke="#FFF" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>SETTINGS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* TEAM COLORS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TEAM COLORS</Text>

          <ColorRow label="Player" selectedKey={settings.player1Color} onSelect={setPlayer1Color} />
          <ColorRow label="Opponent" selectedKey={settings.player2Color} onSelect={setPlayer2Color} />
        </View>

        {/* LIFE MODE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LIFE MODE</Text>

          <View style={styles.segmented}>
            <SegmentedOption label="Count Down" active={settings.lifeMode === "down"} onPress={() => setLifeMode("down")} />
            <SegmentedOption label="Count Up" active={settings.lifeMode === "up"} onPress={() => setLifeMode("up")} />
          </View>

          {showStartingLife ? (
            <View style={styles.stepperCard}>
              <Text style={styles.stepperLabel}>STARTING LIFE</Text>
              <View style={styles.stepperRow}>
                <StepperButton symbol="−" onPress={() => stepStartingLife(-1)} disabled={settings.startingLife <= STARTING_LIFE_MIN} accessibilityLabel="Decrease starting life" />
                <Text style={styles.stepperValue}>{settings.startingLife}</Text>
                <StepperButton symbol="+" onPress={() => stepStartingLife(1)} disabled={settings.startingLife >= STARTING_LIFE_MAX} accessibilityLabel="Increase starting life" />
              </View>
              <View style={styles.presetsRow}>
                {STARTING_LIFE_PRESETS.map((value) => (
                  <PresetChip key={value} value={value} active={settings.startingLife === value} onPress={() => setStartingLife(value)} />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function ColorRow({label, selectedKey, onSelect}) {
  return (
    <View style={styles.colorsRow}>
      <Text style={styles.colorsLabel}>{label}</Text>
      <View style={styles.swatches}>
        {TEAM_COLOR_KEYS.map((key) => {
          const color = TEAM_COLORS[key];
          const selected = selectedKey === key;
          return (
            <Pressable
              key={key}
              onPress={() => onSelect(key)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`${label} color ${color.name}`}
              accessibilityState={{selected}}
              style={({pressed}) => [styles.swatchHit, pressed && styles.pressed]}
            >
              <View style={[styles.swatch, {backgroundColor: color.base}, selected && styles.swatchSelected]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SegmentedOption({label, active, onPress}) {
  if (active) {
    return (
      <Pressable onPress={onPress} style={({pressed}) => [styles.segActive, pressed && styles.pressed]} accessibilityRole="button" accessibilityState={{selected: true}}>
        <LinearGradient colors={["#3c3c3c", "#6e6e6e", "#3c3c3c"]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.segGradient}>
          <Text style={styles.segActiveLabel}>{label.toUpperCase()}</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.segInactive, pressed && styles.pressed]} accessibilityRole="button" accessibilityState={{selected: false}}>
      <Text style={styles.segInactiveLabel}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

function StepperButton({symbol, onPress, disabled, accessibilityLabel}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{disabled}}
      style={({pressed}) => [styles.stepperBtn, pressed && !disabled && styles.pressed, disabled && styles.stepperBtnDisabled]}
    >
      <LinearGradient colors={["#3c3c3c", "#6e6e6e", "#3c3c3c"]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.stepperBtnGradient}>
        <Text style={styles.stepperBtnLabel}>{symbol}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function PresetChip({value, active, onPress}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]} accessibilityRole="button" accessibilityState={{selected: active}} accessibilityLabel={`Set starting life to ${value}`}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
    gap: 8
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  pressed: {
    opacity: 0.7
  },
  headerTitle: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 18,
    letterSpacing: 1.4
  },
  body: {
    padding: 20,
    paddingBottom: 32
  },
  section: {
    marginBottom: 28
  },
  sectionTitle: {
    color: "#888",
    fontFamily: "FiraCode_700Bold",
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 12,
    marginLeft: 2
  },
  colorsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14
  },
  colorsLabel: {
    color: "#DDD",
    fontFamily: "FiraCode_400Regular",
    fontSize: 13,
    letterSpacing: 1,
    width: 76
  },
  swatches: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between"
  },
  swatchHit: {
    padding: 4
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15
  },
  swatchSelected: {
    borderWidth: 2.5,
    borderColor: "#FFF",
    transform: [{scale: 1.1}]
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: "#16161a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    overflow: "hidden",
    minHeight: 48
  },
  segActive: {
    flex: 1
  },
  segGradient: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center"
  },
  segActiveLabel: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 13,
    letterSpacing: 1.4
  },
  segInactive: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48
  },
  segInactiveLabel: {
    color: "#AAA",
    fontFamily: "FiraCode_700Bold",
    fontSize: 13,
    letterSpacing: 1.4
  },
  stepperCard: {
    marginTop: 18,
    backgroundColor: "#0f0f12",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    padding: 18,
    alignItems: "center"
  },
  stepperLabel: {
    color: "#888",
    fontFamily: "FiraCode_700Bold",
    fontSize: 11,
    letterSpacing: 3
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 8
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden"
  },
  stepperBtnDisabled: {
    opacity: 0.4
  },
  stepperBtnGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  stepperBtnLabel: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 28,
    lineHeight: 30,
    ...textShadow({color: "rgba(0,0,0,0.5)", offset: {width: 0, height: 2}, radius: 4})
  },
  stepperValue: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 48,
    minWidth: 96,
    textAlign: "center",
    ...textShadow({color: "rgba(0,0,0,0.6)", offset: {width: 0, height: 2}, radius: 6})
  },
  presetsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    justifyContent: "center",
    flexWrap: "wrap"
  },
  chip: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  chipActive: {
    backgroundColor: "#FFF",
    borderColor: "#FFF"
  },
  chipLabel: {
    color: "#CCC",
    fontFamily: "FiraCode_700Bold",
    fontSize: 13,
    letterSpacing: 1
  },
  chipLabelActive: {
    color: "#000"
  }
});
