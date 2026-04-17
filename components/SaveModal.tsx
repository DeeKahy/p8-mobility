import { useState } from "react";
import { Modal, TouchableOpacity, View, Text, StyleSheet } from "react-native";

type SaveFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  onSaveNext: () => void;
};

export const SaveFormModal = ({
  visible,
  onClose,
  onSave,
  onSaveNext,
}: SaveFormModalProps) => {
  const [saveAndNext, setSaveAndNext] = useState(false);

  const handleSave = () => {
    if (saveAndNext) {
      onSaveNext();
    } else {
      onSave();
    }
  };

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Save Floorplan</Text>
          <Text style={styles.message}>
            Do you want to save the current floorplan?
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.secondaryButton]}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.button, styles.primaryButton]}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {saveAndNext ? "Save and Next" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => setSaveAndNext(!saveAndNext)}
            style={styles.switchModeButton}
          >
            <Text style={styles.switchModeText}>
              {saveAndNext ? "Switch to Save Only" : "Switch to Save and Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: "#4B5563",
    marginBottom: 18,
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: "row",
    columnGap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#0B57D0",
  },
  secondaryButton: {
    backgroundColor: "#F3F4F6",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#111827",
  },
  switchModeButton: {
    marginTop: 14,
    alignSelf: "center",
    paddingVertical: 4,
  },
  switchModeText: {
    fontSize: 14,
    color: "#0B57D0",
    fontWeight: "500",
  },
});
