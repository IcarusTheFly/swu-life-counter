import {View, StyleSheet, Pressable, Modal, Text} from "react-native";

export default function ConfirmationModal({visible = false, onPressYes = () => {}, onPressNo = () => {}}) {
  return (
    <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onPressNo}>
      <View style={styles.modalOverlay}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Are you sure you want to reset the app?</Text>
          <View style={styles.dialogActions}>
            <Pressable style={[styles.dialogButton, styles.dialogButtonYes]} onPress={onPressYes}>
              <Text style={styles.dialogButtonText}>Yes</Text>
            </Pressable>
            <Pressable style={[styles.dialogButton, styles.dialogButtonNo]} onPress={onPressNo}>
              <Text style={styles.dialogButtonText}>No</Text>
            </Pressable>
          </View>
        </View>
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
    backgroundColor: "#CCC",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 5 // For Android shadow
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10
  },
  dialogMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20
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
    fontSize: 16
  }
});
