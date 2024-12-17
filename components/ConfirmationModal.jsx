import {View, StyleSheet, Pressable, Modal, Text} from "react-native";
import {LinearGradient} from "expo-linear-gradient";

export default function ConfirmationModal({visible = false, onPressYes = () => {}, onPressNo = () => {}}) {
  return (
    <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onPressNo}>
      <View style={styles.modalOverlay}>
        <LinearGradient colors={["#3c3c3c", "#6e6e6e", "#3c3c3c"]} style={styles.dialog} start={{x: 1, y: 0}} end={{x: 0, y: 1}}>
          <Text style={styles.dialogTitle}>Are you sure you want to restart the app?</Text>
          <View style={styles.dialogActions}>
            <Pressable style={[styles.dialogButton, styles.dialogButtonYes]} onPress={onPressYes}>
              <Text style={styles.dialogButtonText}>Yes</Text>
            </Pressable>
            <Pressable style={[styles.dialogButton, styles.dialogButtonNo]} onPress={onPressNo}>
              <Text style={styles.dialogButtonText}>No</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent black background
    justifyContent: "center",
    alignItems: "center"
  },
  dialog: {
    width: "80%",
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 2,
    padding: 20,
    alignItems: "center",
    elevation: 5 // For Android shadow
  },
  dialogTitle: {
    fontSize: 20,
    color: "white",
    textShadowColor: "black",
    textShadowOffset: {
      width: 0,
      height: 1
    },
    textAlign: "center",
    marginBottom: 15
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%"
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: "center"
  },
  dialogButtonYes: {
    backgroundColor: "#8B0000"
  },
  dialogButtonNo: {
    backgroundColor: "#4B79A1"
  },
  dialogButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    textShadowColor: "black",
    textShadowOffset: {
      width: 0,
      height: 2
    },
    fontSize: 24
  }
});
