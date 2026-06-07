import React from "react";
import {StyleSheet, Text} from "react-native";
import {TEXT, TYPE} from "../../constants/theme";

// An uppercase section heading over the space backdrop (e.g. "YOUR DECKS").
export default function SectionLabel({children, style}) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {...TYPE.label, color: TEXT.onSpace.secondary, marginBottom: 9, marginLeft: 2}
});
