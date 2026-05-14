import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Overlay } from "../context/Overlays";

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
  if (!visible) return null;
  return (
    <Overlay>
      <Animated.View style={styles.overlay} entering={FadeIn} exiting={FadeOut}>
        <View style={styles.card}>
          <Text style={styles.title}>Save Floorplan</Text>
          <Text style={styles.message}>
            Choose what to do after saving this room.
          </Text>

          <View style={styles.actionColumn}>
            <TouchableOpacity
              onPress={onSave}
              style={[styles.button, styles.primaryButton]}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                Save and review floorplan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSaveNext}
              style={[styles.button, styles.primaryButton]}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                Save and measure next room
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.button, styles.secondaryButton]}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Overlay>
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
  actionColumn: {
    rowGap: 10,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#2196F3",
  },
  secondaryButton: {
    backgroundColor: "#F3F4F6",
    top: 10,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#111827",
  },
});
