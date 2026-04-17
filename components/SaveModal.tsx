import { useState } from "react";
import { Modal, TouchableOpacity, View, Text } from "react-native";

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
    <Modal animationType="slide" transparent visible={visible}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View
          style={{ backgroundColor: "white", padding: 20, borderRadius: 10 }}
        >
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Do you want to save the current floorplan?
          </Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <TouchableOpacity onPress={onClose} style={{ marginRight: 10 }}>
              <Text style={{ fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave}>
              <Text style={{ fontSize: 16 }}>
                {saveAndNext ? "Save and Next" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => setSaveAndNext(!saveAndNext)}
            style={{ marginTop: 10 }}
          >
            <Text style={{ fontSize: 14, color: "blue" }}>
              {saveAndNext ? "Switch to Save Only" : "Switch to Save and Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
