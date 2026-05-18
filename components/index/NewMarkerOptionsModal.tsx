import { Dispatch, SetStateAction } from "react";
import { Pressable, Text, TouchableOpacity } from "react-native";

import { Overlay } from "../../context/Overlays";
import { styles } from "../../css/indexStyle";

interface NewMarkerOptionsModalProps {
  showModal: boolean;
  setShowTempMarker: Dispatch<SetStateAction<boolean>>;
  setShowNewMarkerOptions: Dispatch<SetStateAction<boolean>>;
  handleNewMarkerFromPicture: () => void;
  handleNewMarkerFromCameraRoll: () => void;
}

export const NewMarkerOptionsModal = (props: NewMarkerOptionsModalProps) => {
  const {
    showModal,
    setShowTempMarker,
    setShowNewMarkerOptions,
    handleNewMarkerFromPicture,
    handleNewMarkerFromCameraRoll,
  } = props;
  if (!showModal) return null;
  return (
    <Overlay style={styles.modalOverlay} animationType="fade">
      <Pressable onPress={() => setShowNewMarkerOptions(false)}>
        <Pressable
          style={styles.optionsModal}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.optionsTitle}>Add Picture</Text>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleNewMarkerFromPicture}
          >
            <Text style={styles.optionText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleNewMarkerFromCameraRoll}
          >
            <Text style={styles.optionText}>Choose from Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionCancelButton}
            onPress={() => {
              setShowTempMarker(false);
              setShowNewMarkerOptions(false);
            }}
          >
            <Text style={styles.optionCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Overlay>
  );
};
