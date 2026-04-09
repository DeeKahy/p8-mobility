import { Text, View } from "react-native";
import { SharedValue, useSharedValue } from "react-native-reanimated";

import Downscale from "./Downscale";
import { styles } from "../../css/indexStyle";
import { Marker } from "../../hooks/useMarkers";

interface MarkerProps {
  marker: Marker;
  scale?: SharedValue<number>;
}

export const MarkerElement = (props: MarkerProps) => {
  const DEFAULT_SCALE = useSharedValue(1); // Don't transform if scale isn't given.
  const { marker, scale = DEFAULT_SCALE } = props;

  return (
    <Downscale
      scale={scale}
      style={{
        ...styles.marker,
        /* (x,y) should be the center of the marker */
        left: marker.x - styles.marker.width / 2,
        top: marker.y - styles.marker.height / 2,
        transformOrigin: "top left",
      }}
    >
      <View style={styles.markerDot} />
      <Text style={styles.markerCount}>{marker.photos.length}</Text>
    </Downscale>
  );
};
