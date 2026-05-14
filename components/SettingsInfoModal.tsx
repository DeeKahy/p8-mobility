import { type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

import { Overlay } from "../context/Overlays";

type SettingsInfoModalProps = {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

// Renders a full screen settings info modal.
export default function SettingsInfoModal({
  visible,
  title,
  children,
  onClose,
}: SettingsInfoModalProps) {
  if (!visible) return null;
  return (
    <Overlay>
      <Animated.View
        style={styles.container}
        entering={SlideInDown}
        exiting={SlideOutDown}
      >
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>x</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <ScrollView style={styles.content}>{children}</ScrollView>
      </Animated.View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    backgroundColor: "white",
  },

  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 12,
  },

  closeText: {
    fontSize: 28,
    fontWeight: "600",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },

  content: {
    flex: 1,
  },
});
