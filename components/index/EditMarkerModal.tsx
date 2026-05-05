import { Text, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import Downscale from "./Downscale";
import { Point } from "../../context/FloorplanContext";
import { styles } from "../../css/indexStyle";

interface EditMarkerModalProps {
  tempMarker: Point<SharedValue<number>>;
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

  // Dynamic repositioning
  const animatedStyle = useAnimatedStyle(() => ({
    left: tempMarker.x.value - styles.popup.width / 2,
    top: tempMarker.y.value - 120,
  }));

  return (
    <Animated.View style={[{ position: "absolute" }, animatedStyle]}>
      <GestureDetector gesture={consumeTap}>
        <Downscale
          scale={scale}
          style={{
            ...styles.popup,

            transformOrigin: "bottom",
          }}
        >
          <TouchableOpacity style={styles.popupButton} onPress={onAddPicture}>
            <Text style={styles.popupText}>Add picture for this space?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.popupCancel} onPress={onCancel}>
            <Text style={styles.popupCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Downscale>
      </GestureDetector>
    </Animated.View>
  );
};
