import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import HelpItemsContent from "./HelpItemsContent";
import SettingsInfoModal from "./SettingsInfoModal";

// Renders the floating help button and modal.
export default function FloatingHelpButton() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <Pressable style={styles.helpButton} onPress={() => setShowHelp(true)}>
        <Text style={styles.helpText}>?</Text>
      </Pressable>
      <SettingsInfoModal
        visible={showHelp}
        title="How to use our app"
        onClose={() => setShowHelp(false)}
      >
        <HelpItemsContent />
      </SettingsInfoModal>
    </>
  );
}

const styles = StyleSheet.create({
  helpButton: {
    alignItems: "center",
    backgroundColor: "#2196F3",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    left: 12,
    position: "absolute",
    top: 48,
    width: 28,
    zIndex: 10,
  },

  helpText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
