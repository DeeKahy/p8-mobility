import { Pressable, Text, TouchableOpacity } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Overlay } from "../../context/Overlays";
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const MarkerOptionsModal = (props: MarkerOptionsModalProps) => {
  const {
    marker,
    showModal,
    handleShowPhotos,
    closeAllModals,
    handleAddFromPictureToMarker,
    handleAddFromCameraRollToMarker,
  } = props;
  if (!showModal) return null;
  return (
    <Overlay>
      <AnimatedPressable
        style={styles.modalOverlay}
        onPress={closeAllModals}
        entering={FadeIn}
        exiting={FadeOut}
      >
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
      </AnimatedPressable>
    </Overlay>
  );
};
