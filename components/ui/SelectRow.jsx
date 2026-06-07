import React, {useState} from "react";
import {Pressable, StyleSheet, Text, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {DropdownSheet} from "../Dropdown";
import {ASPECTS} from "../../constants/decks";
import {METAL, RADIUS, TEXT, TYPE} from "../../constants/theme";

// A full-width labeled metallic select — its own row, so long deck names read.
// The trigger is brushed silver (dark text); tapping opens the shared picker
// sheet. `options`: [{key, label, aspects?, aspectColor?, special?}]. A deck
// option shows ALL its aspect dots; a `special` option (Random / Create) renders
// in italic. `compact` tightens the row for landscape.
export default function SelectRow({
  label,
  value,
  options = [],
  onSelect,
  placeholder = "Select",
  enableAnimations = true,
  compact = false
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.key === value) || null;
  const text = selected ? selected.label : placeholder;
  const aspects = selected && Array.isArray(selected.aspects) ? selected.aspects.filter((a) => ASPECTS[a]) : [];
  return (
    <View style={styles.row}>
      {label ? <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={({pressed}) => [styles.triggerWrap, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${text}. Tap to change.`}
      >
        <LinearGradient colors={METAL.surface} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={[styles.trigger, compact && styles.triggerCompact]}>
          {aspects.length > 0 ? (
            <View style={styles.dots}>
              {aspects.map((a) => (
                <View key={a} style={[styles.dot, {backgroundColor: ASPECTS[a].color}]} />
              ))}
            </View>
          ) : selected && selected.aspectColor ? (
            <View style={[styles.dot, {backgroundColor: selected.aspectColor}]} />
          ) : null}
          <Text
            style={[styles.triggerText, !selected && styles.placeholder, selected && selected.special && styles.specialText]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {text}
          </Text>
          <Text style={styles.chevron}>▾</Text>
        </LinearGradient>
      </Pressable>
      <DropdownSheet
        visible={open}
        title={label}
        options={options}
        selectedKey={value}
        onPick={(k) => {
          setOpen(false);
          if (onSelect) onSelect(k);
        }}
        onClose={() => setOpen(false)}
        enableAnimations={enableAnimations}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {width: "100%"},
  label: {...TYPE.label, fontSize: 10, color: TEXT.onSpace.secondary, marginBottom: 4, marginLeft: 2},
  labelCompact: {marginBottom: 2, fontSize: 9},
  triggerWrap: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: METAL.border,
    borderTopColor: METAL.bevelLight,
    borderBottomColor: METAL.bevelDark
  },
  pressed: {opacity: 0.85},
  trigger: {flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 13, minHeight: 42},
  triggerCompact: {minHeight: 34, paddingHorizontal: 11},
  dots: {flexDirection: "row", alignItems: "center", gap: 4},
  dot: {width: 11, height: 11, borderRadius: 6, borderWidth: 1, borderColor: "rgba(0,0,0,0.35)"},
  triggerText: {flex: 1, color: TEXT.onMetal.primary, ...TYPE.title, fontSize: 14},
  placeholder: {color: TEXT.onMetal.muted, fontFamily: "FiraCode_400Regular"},
  specialText: {fontFamily: "FiraCode_400Regular", fontStyle: "italic"},
  chevron: {color: TEXT.onMetal.secondary, fontFamily: "FiraCode_700Bold", fontSize: 13}
});
