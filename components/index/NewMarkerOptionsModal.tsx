import { Dispatch, SetStateAction } from "react";
import { Pressable, Text, TouchableOpacity } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Overlay } from "../../context/ToastProvider";
import { styles } from "../../css/indexStyle";

interface NewMarkerOptionsModalProps {
  showModal: boolean;
  setShowTempMarker: Dispatch<SetStateAction<boolean>>;
  setShowNewMarkerOptions: Dispatch<SetStateAction<boolean>>;
  handleNewMarkerFromPicture: () => void;
  handleNewMarkerFromCameraRoll: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
    <Overlay>
      <AnimatedPressable
        style={styles.modalOverlay}
        onPress={() => setShowNewMarkerOptions(false)}
        entering={FadeIn}
        exiting={FadeOut}
      >
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
      </AnimatedPressable>
    </Overlay>
  );
};
