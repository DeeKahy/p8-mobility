import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type SettingsInfoModalProps = {
  visible: boolean;
  title: string;
  items: string[];
  onClose: () => void;
};

// Renders a full screen settings info modal.
export default function SettingsInfoModal({
  visible,
  title,
  items,
  onClose,
}: SettingsInfoModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>x</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <ScrollView style={styles.content}>
          {items.map((item) => (
            <Text key={item} style={styles.item}>
              {item}
            </Text>
          ))}
        </ScrollView>
      </View>
    </Modal>
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

  item: {
    fontSize: 18,
    marginBottom: 16,
  },
});
