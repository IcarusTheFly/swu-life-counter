import React, {useEffect, useRef, useState} from "react";
import {Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {textShadow} from "../utils/textShadow";

// react-native-web has no native animated module; mirror the app's gate.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

// Shared labeled dropdown primitive (v3 — design.md Decision 7).
//
// A bordered "pill" showing the current selection (optional aspect-dot
// prefix + label) with a ▾ chevron. Tapping it opens a Modal scroll list of
// options; selecting one fires `onSelect(key)` and closes. A small fade+rise
// animates the sheet in, gated on `enableAnimations`.
//
// Props:
//   label        — small-caps label rendered above the pill
//   value        — the currently-selected option key (or null)
//   options      — [{key, label, aspectColor?, special?}]
//                  `special: true` styles the row as a distinct action
//                  (e.g. "Random" or "Create a deck").
//   onSelect(key)— called with the chosen option key
//   placeholder  — pill text when no option matches `value`
//   enableAnimations — gates the sheet entry animation
//   accessibilityLabel — overrides the derived a11y label on the pill

export default function Dropdown({
  label,
  value,
  options = [],
  onSelect,
  placeholder = "Select",
  enableAnimations = true,
  accessibilityLabel
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.key === value) || null;

  const handlePick = (key) => {
    setOpen(false);
    if (onSelect) onSelect(key);
  };

  const pillLabel = selected ? selected.label : placeholder;
  const pillDotColor = selected ? selected.aspectColor : null;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={({pressed}) => [styles.pill, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `${label}: ${pillLabel}. Tap to change.`}
      >
        {pillDotColor ? <View style={[styles.pillDot, {backgroundColor: pillDotColor}]} /> : null}
        <Text
          style={[styles.pillText, !selected && styles.placeholderText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {pillLabel}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <DropdownSheet
        visible={open}
        title={label}
        options={options}
        selectedKey={value}
        onPick={handlePick}
        onClose={() => setOpen(false)}
        enableAnimations={enableAnimations}
      />
    </View>
  );
}

// Exported (additive — the default `Dropdown` export is unchanged) so callers
// that need the picker sheet WITHOUT the inline pill can drive it themselves.
// The in-game deck badge (PlayerView) uses this: the pill-equivalent lives on
// the rotated player half, but the sheet must render upright, so LifeCounter
// renders the sheet at its own (non-rotated) root and controls `visible`.
//
// Props:
//   visible      — whether the Modal is shown
//   title        — small-caps header above the list (optional)
//   options      — [{key, label, aspectColor?, special?}] (same shape as Dropdown)
//   selectedKey  — the currently-selected option key (gets the ✓ + highlight)
//   onPick(key)  — called with the chosen option key
//   onClose      — called on backdrop tap / hardware back
//   enableAnimations — gates the sheet entry animation
export function DropdownSheet({visible, title, options, selectedKey, onPick, onClose, enableAnimations}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      translateY.setValue(12);
      return;
    }
    const duration = enableAnimations ? 160 : 0;
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration, useNativeDriver: USE_NATIVE_DRIVER}),
      Animated.timing(translateY, {toValue: 0, duration, useNativeDriver: USE_NATIVE_DRIVER})
    ]).start();
  }, [visible, enableAnimations, opacity, translateY]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss">
        {/* Inner Pressable stops the backdrop tap from closing when the user
            taps inside the sheet. */}
        <Pressable onPress={() => {}} style={styles.sheetWrap}>
          <Animated.View style={{opacity, transform: [{translateY}], width: "100%"}}>
            <LinearGradient
              colors={["#1c1c22", "#141418"]}
              style={styles.sheet}
              start={{x: 0, y: 0}}
              end={{x: 0, y: 1}}
            >
              {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
              <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {options.map((opt) => {
                  const isSelected = opt.key === selectedKey;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => onPick(opt.key)}
                      style={({pressed}) => [
                        styles.optionRow,
                        opt.special && styles.optionRowSpecial,
                        isSelected && styles.optionRowSelected,
                        pressed && styles.pressed
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{selected: isSelected}}
                      accessibilityLabel={opt.label}
                    >
                      {opt.aspectColor ? (
                        <View style={[styles.optionDot, {backgroundColor: opt.aspectColor}]} />
                      ) : opt.special ? null : (
                        <View style={styles.optionDotSpacer} />
                      )}
                      <Text
                        style={[styles.optionLabel, opt.special && styles.optionLabelSpecial]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {opt.label}
                      </Text>
                      {isSelected ? <Text style={styles.optionCheck}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: 0
  },
  label: {
    color: "#888",
    fontFamily: "FiraCode_700Bold",
    fontSize: 10,
    letterSpacing: 2.5,
    marginBottom: 7,
    marginLeft: 2
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#15151a",
    borderWidth: 1,
    borderColor: "#2a2a2e",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 46,
    gap: 8
  },
  pressed: {
    opacity: 0.75
  },
  pillDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)"
  },
  pillText: {
    flex: 1,
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 14,
    letterSpacing: 0.4
  },
  placeholderText: {
    color: "#777",
    fontFamily: "FiraCode_400Regular"
  },
  chevron: {
    color: "#AAA",
    fontFamily: "FiraCode_700Bold",
    fontSize: 12
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20
  },
  sheetWrap: {
    width: "100%",
    maxWidth: 420
  },
  sheet: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#34343c",
    padding: 16,
    elevation: 6
  },
  sheetTitle: {
    color: "#888",
    fontFamily: "FiraCode_700Bold",
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 12,
    marginLeft: 2
  },
  list: {
    maxHeight: 340
  },
  listContent: {
    gap: 8
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1f26",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    gap: 10
  },
  optionRowSpecial: {
    backgroundColor: "#17171c",
    borderColor: "#34343c",
    borderStyle: "dashed"
  },
  optionRowSelected: {
    borderColor: "#4B79A1",
    backgroundColor: "#26303a"
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)"
  },
  optionDotSpacer: {
    width: 12,
    height: 12
  },
  optionLabel: {
    flex: 1,
    color: "#FFF",
    fontFamily: "FiraCode_700Bold",
    fontSize: 14,
    letterSpacing: 0.4
  },
  optionLabelSpecial: {
    color: "#CCC",
    fontFamily: "FiraCode_400Regular"
  },
  optionCheck: {
    color: "#7fb4e0",
    fontFamily: "FiraCode_700Bold",
    fontSize: 15
  }
});
