import {View, StyleSheet, Pressable} from "react-native";
import ResetIcon from "../icons/ResetIcon";

export default function Divider({onPress = () => {}}) {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.divider} />
      <Pressable style={styles.circleButton} onPress={onPress}>
        <ResetIcon stroke="white" />
      </Pressable>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  dividerContainer: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    marginTop: -22
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc"
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#666",
    borderColor: "#ccc",
    borderWidth: 3,
    padding: 4
  }
});
