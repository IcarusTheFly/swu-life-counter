import React, {useEffect, useRef, useState} from "react";
import {BackHandler, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import BackIcon from "../icons/BackIcon";
import Dropdown from "./Dropdown";
import {useSettings} from "../context/SettingsContext";
import {INITIAL_LIFE_MAX, INITIAL_LIFE_MIN, INITIAL_LIFE_PRESETS} from "../constants/settings";
import {TEAM_COLORS, TEAM_COLOR_KEYS} from "../constants/teamColors";
import {textShadow} from "../utils/textShadow";

const SHOW_HAPTICS_SECTION = Platform.OS !== "web";

// Module-level so it's built once, not per render.
const COLOR_OPTIONS = TEAM_COLOR_KEYS.map((key) => ({
  key,
  label: TEAM_COLORS[key].name,
  aspectColor: TEAM_COLORS[key].base
}));

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

  const stepInitialLife = (delta) => {
    const next = Math.max(INITIAL_LIFE_MIN, Math.min(INITIAL_LIFE_MAX, settings.initialLife + delta));
    if (next !== settings.initialLife) updateSettings({initialLife: next});
  };

  const setInitialLife = (value) => updateSettings({initialLife: value});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({pressed}) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <BackIcon stroke="#FFF" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>SETTINGS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* TEAM COLORS — two dropdowns side by side */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TEAM COLORS</Text>
          <View style={styles.colorsCard}>
            <Dropdown
              label="PLAYER"
              value={settings.player1Color}
              options={COLOR_OPTIONS}
              onSelect={(key) => updateSettings({player1Color: key})}
              enableAnimations={settings.enableAnimations}
              accessibilityLabel={`Player color: ${TEAM_COLORS[settings.player1Color]?.name ?? ""}`}
            />
            <Dropdown
              label="OPPONENT"
              value={settings.player2Color}
              options={COLOR_OPTIONS}
              onSelect={(key) => updateSettings({player2Color: key})}
              enableAnimations={settings.enableAnimations}
              accessibilityLabel={`Opponent color: ${TEAM_COLORS[settings.player2Color]?.name ?? ""}`}
            />
          </View>
        </View>

        {/* INITIAL LIFE POINTS — editable input between − and + */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INITIAL LIFE POINTS</Text>
          <LifeStepper
            value={settings.initialLife}
            onStep={stepInitialLife}
            onCommit={setInitialLife}
          />
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

// ─── Life stepper with inline editable value ─────────────────────────────────
//
// The big number between − and + is now a TextInput so the user can type
// directly. Validates on blur / submit; flashes an error for 2 s on bad input
// and reverts to the last valid value. The separate "TYPE A VALUE" section
// above the stepper has been removed.

function LifeStepper({value, onStep, onCommit}) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState(null);
  const errorRef = useRef(null);

  // Keep draft in sync when the value changes via stepper or preset.
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  useEffect(() => () => clearTimeout(errorRef.current), []);

  const flashError = (msg) => {
    setError(msg);
    clearTimeout(errorRef.current);
    errorRef.current = setTimeout(() => setError(null), 2000);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) { setDraft(String(value)); return; }
    const n = Number(trimmed);
    if (!Number.isInteger(n) || n < INITIAL_LIFE_MIN || n > INITIAL_LIFE_MAX) {
      flashError(`${INITIAL_LIFE_MIN}–${INITIAL_LIFE_MAX} only`);
      setDraft(String(value));
      return;
    }
    if (n !== value) onCommit(n);
  };

  return (
    <View style={styles.stepperCard}>
      <View style={styles.stepperRow}>
        <StepperButton
          symbol="−"
          onPress={() => onStep(-1)}
          disabled={value <= INITIAL_LIFE_MIN}
          accessibilityLabel="Decrease initial life"
        />

        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={3}
          selectTextOnFocus
          style={styles.stepperInput}
          accessibilityLabel="Initial life points"
        />

        <StepperButton
          symbol="+"
          onPress={() => onStep(1)}
          disabled={value >= INITIAL_LIFE_MAX}
          accessibilityLabel="Increase initial life"
        />
      </View>

      {error ? <Text style={styles.stepperError}>{error}</Text> : null}

      <View style={styles.presetsRow}>
        {INITIAL_LIFE_PRESETS.map((v) => (
          <PresetChip key={v} value={v} active={value === v} onPress={() => onCommit(v)} />
        ))}
      </View>
    </View>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StepperButton({symbol, onPress, disabled, accessibilityLabel}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{disabled}}
      style={({pressed}) => [
        styles.stepperBtn,
        pressed && !disabled && styles.pressed,
        disabled && styles.stepperBtnDisabled
      ]}
    >
      <LinearGradient
        colors={["#3c3c3c", "#6e6e6e", "#3c3c3c"]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.stepperBtnGradient}
      >
        <Text style={styles.stepperBtnLabel}>{symbol}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function PresetChip({value, active, onPress}) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityState={{selected: active}}
      accessibilityLabel={`Set initial life to ${value}`}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{value}</Text>
    </Pressable>
  );
}

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
        trackColor={{false: "#3a3a3a", true: "#6e6e6e"}}
        thumbColor={value ? "#e8e8e8" : "#9a9a9a"}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{checked: value}}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  // ── Color dropdowns ──
  colorsCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#0f0f12",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    padding: 14
  },

  // ── Life stepper ──
  stepperCard: {
    backgroundColor: "#0f0f12",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    padding: 18,
    alignItems: "center"
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    flexShrink: 0
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
  // The big editable number between − and +. Fixed width + flexShrink:0 so it
  // never overflows the card on wide web viewports (mirrors the BulkAdd fix).
  stepperInput: {
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 48,
    width: 120,
    flexGrow: 0,
    flexShrink: 0,
    textAlign: "center",
    backgroundColor: "#16161a",
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  stepperError: {
    color: "#ff6b6b",
    fontFamily: "FiraCode_400Regular",
    fontSize: 12,
    marginTop: 8,
    letterSpacing: 0.5
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

  // ── Toggles ──
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
