import { Modal, Pressable, Text, TouchableOpacity } from "react-native";

import { styles } from "../../css/indexStyle";
import { Marker } from "../../hooks/useMarkers";

interface MarkerOptionsModalProps {
  showModal: boolean;
  marker: Marker | undefined;
  handleShowPhotos: () => void;
  closeAllModals: () => void;
  handleAddFromPictureToMarker: () => void;
  handleAddFromCameraRollToMarker: () => void;
}

export const MarkerOptionsModal = (props: MarkerOptionsModalProps) => {
  const {
    showModal,
    marker,
    handleShowPhotos,
    closeAllModals,
    handleAddFromPictureToMarker,
    handleAddFromCameraRollToMarker,
  } = props;

  return (
    <Modal visible={showModal} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={closeAllModals}>
        <Pressable
          style={styles.optionsModal}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.optionsTitle}>Marker Options</Text>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleShowPhotos}
          >
            <Text style={styles.optionText}>
              Show Pictures ({marker?.photos.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleAddFromPictureToMarker}
          >
            <Text style={styles.optionText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleAddFromCameraRollToMarker}
          >
            <Text style={styles.optionText}>Choose from Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionCancelButton}
            onPress={closeAllModals}
          >
            <Text style={styles.optionCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
