import { Text, StyleSheet } from "react-native";

import SettingsInfoModal from "./SettingsInfoModal";
import { userGuideItems } from "../utils/userGuideItems";

type UserGuideItemsProps = {
  visible: boolean;
  onClose: () => void;
};

// Renders the user guide items modal.
export default function UserGuideItems({
  visible,
  onClose,
}: UserGuideItemsProps) {
  return (
    <SettingsInfoModal visible={visible} title="User guide" onClose={onClose}>
      {userGuideItems.map((item) => (
        <Text key={item} style={styles.item}>
          {item}
        </Text>
      ))}
    </SettingsInfoModal>
  );
}

const styles = StyleSheet.create({
  item: {
    fontSize: 18,
    marginBottom: 16,
  },
});
