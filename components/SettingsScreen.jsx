import React, {useEffect, useRef, useState} from "react";
import {BackHandler, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import BackIcon from "../icons/BackIcon";
import {useSettings} from "../context/SettingsContext";
import {INITIAL_LIFE_MAX, INITIAL_LIFE_MIN, INITIAL_LIFE_PRESETS} from "../constants/settings";
import {TEAM_COLORS, TEAM_COLOR_KEYS} from "../constants/teamColors";
import {textShadow} from "../utils/textShadow";

const SHOW_HAPTICS_SECTION = Platform.OS !== "web";

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

  const stepInitialLife = (delta) => {
    const next = Math.max(INITIAL_LIFE_MIN, Math.min(INITIAL_LIFE_MAX, settings.initialLife + delta));
    if (next !== settings.initialLife) {
      updateSettings({initialLife: next});
    }
  };

  const setInitialLife = (value) => updateSettings({initialLife: value});

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

        {/* INITIAL LIFE POINTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INITIAL LIFE POINTS</Text>

          <View style={styles.stepperCard}>
            <InitialLifeTextInput value={settings.initialLife} onCommit={setInitialLife} />

            <View style={styles.stepperRow}>
              <StepperButton symbol="−" onPress={() => stepInitialLife(-1)} disabled={settings.initialLife <= INITIAL_LIFE_MIN} accessibilityLabel="Decrease initial life" />
              <Text style={styles.stepperValue}>{settings.initialLife}</Text>
              <StepperButton symbol="+" onPress={() => stepInitialLife(1)} disabled={settings.initialLife >= INITIAL_LIFE_MAX} accessibilityLabel="Increase initial life" />
            </View>

            <View style={styles.presetsRow}>
              {INITIAL_LIFE_PRESETS.map((value) => (
                <PresetChip key={value} value={value} active={settings.initialLife === value} onPress={() => setInitialLife(value)} />
              ))}
            </View>
          </View>
        </View>

        {/* ANIMATIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ANIMATIONS</Text>
          <SettingToggle
            label="Enable animations"
            description="Life-change overlay and initiative shine"
            value={settings.enableAnimations}
            onValueChange={(v) => updateSettings({enableAnimations: v})}
          />
        </View>

        {/* HAPTIC FEEDBACK — mobile only */}
        {SHOW_HAPTICS_SECTION && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HAPTIC FEEDBACK</Text>
            <SettingToggle
              label="Vibrate on tap"
              description="Brief tap on +/− presses"
              value={settings.enableHaptics}
              onValueChange={(v) => updateSettings({enableHaptics: v})}
            />
          </View>
        )}
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

/**
 * Numeric text input for Initial Life Points. Uses a local draft so we don't
 * commit on every keystroke; commits on blur or onSubmitEditing. Out-of-range
 * input reverts to the persisted value and shows an inline error for ~2s.
 */
function InitialLifeTextInput({value, onCommit}) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState(null);
  const errorTimeoutRef = useRef(null);

  // Keep the draft in sync if the persisted value changes from elsewhere
  // (e.g. stepper or preset chip).
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  // Clear any pending error-clear timeout when the component unmounts.
  useEffect(() => () => clearTimeout(errorTimeoutRef.current), []);

  const flashError = (message) => {
    setError(message);
    clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 2000);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === "") {
      // Empty input — silently revert without an error message.
      setDraft(String(value));
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < INITIAL_LIFE_MIN || parsed > INITIAL_LIFE_MAX) {
      flashError(`${INITIAL_LIFE_MIN}–${INITIAL_LIFE_MAX} only`);
      setDraft(String(value));
      return;
    }
    if (parsed !== value) {
      onCommit(parsed);
    }
  };

  return (
    <View style={styles.textInputWrap}>
      <Text style={styles.textInputLabel}>TYPE A VALUE</Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="number-pad"
        returnKeyType="done"
        maxLength={3}
        style={styles.textInput}
        selectTextOnFocus
        accessibilityLabel="Initial life points"
        placeholderTextColor="#666"
      />
      {error ? <Text style={styles.textInputError}>{error}</Text> : null}
    </View>
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
    <Pressable onPress={onPress} style={({pressed}) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]} accessibilityRole="button" accessibilityState={{selected: active}} accessibilityLabel={`Set initial life to ${value}`}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{value}</Text>
    </Pressable>
  );
}

/**
 * Reusable toggle row for boolean settings. Label + optional description
 * on the left, native Switch on the right.
 */
function SettingToggle({label, description, value, onValueChange}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleTextCol}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.toggleDescription}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        // The default thumb/track colors look fine in dark mode on every platform;
        // we only nudge the track-on color so it matches the silver theme.
        trackColor={{false: "#3a3a3a", true: "#6e6e6e"}}
        thumbColor={value ? "#e8e8e8" : "#9a9a9a"}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{checked: value}}
      />
    </View>
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
  stepperCard: {
    backgroundColor: "#0f0f12",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    padding: 18,
    alignItems: "center"
  },
  textInputWrap: {
    width: "100%",
    alignItems: "center",
    marginBottom: 14
  },
  textInputLabel: {
    color: "#888",
    fontFamily: "FiraCode_700Bold",
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 6
  },
  textInput: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 22,
    backgroundColor: "#16161a",
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 96,
    textAlign: "center"
  },
  textInputError: {
    color: "#ff6b6b",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 0.5
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginTop: 4
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
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f0f12",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    padding: 14,
    minHeight: 56
  },
  toggleTextCol: {
    flex: 1,
    marginRight: 12
  },
  toggleLabel: {
    color: "#FFF",
    fontFamily: "FiraCode_400Regular",
    fontSize: 14,
    letterSpacing: 0.5
  },
  toggleDescription: {
    color: "#888",
    fontFamily: "FiraCode_400Regular",
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: 2
  }
});
