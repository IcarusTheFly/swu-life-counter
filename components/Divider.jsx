import {View, StyleSheet, Pressable} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import ResetIcon from "../icons/ResetIcon";

export default function Divider({onPress = () => {}}) {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.divider} />
      <Pressable onPress={onPress}>
        <LinearGradient colors={["#3c3c3c", "#6e6e6e", "#a1a1a1", "#6e6e6e", "#3c3c3c"]} style={styles.circleButton} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
          <ResetIcon stroke="white" />
        </LinearGradient>
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
    height: 2,
    backgroundColor: "#ccc"
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 2,
    padding: 4
  }
});
