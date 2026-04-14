import { Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { SharedValue, useSharedValue } from "react-native-reanimated";

import Downscale from "./Downscale";
import { styles } from "../../css/indexStyle";

interface EditMarkerModalProps {
  tempMarker: {
    x: number;
    y: number;
  };
  onCancel: () => void;
  onAddPicture: () => void;
  scale?: SharedValue<number>;
}

const consumeTap = Gesture.Tap().onStart(() => {
  /* Prevent single tap-gestures from propagating. */
});

export const EditMarkerModal = (props: EditMarkerModalProps) => {
  const DEFAULT_SCALE = useSharedValue(1); // Don't transform if scale isn't given.
  const { tempMarker, onCancel, onAddPicture, scale = DEFAULT_SCALE } = props;

  return (
    <GestureDetector gesture={consumeTap}>
      <Downscale
        scale={scale}
        style={{
          ...styles.popup,

          left: tempMarker.x - 82,
          top: tempMarker.y - 120,
          transformOrigin: "bottom",
        }}
      >
        <TouchableOpacity style={styles.popupButton} onPress={onAddPicture}>
          <Text style={styles.popupText}>Add picture for this space?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.popupCancel} onPress={onCancel}>
          <Text style={styles.popupCancelText}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.popupArrow} />
      </Downscale>
    </GestureDetector>
  );
};
