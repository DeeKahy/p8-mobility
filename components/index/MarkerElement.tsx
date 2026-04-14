import { Text, View } from "react-native";

import { styles } from "../../css/indexStyle";
import { Marker } from "../../hooks/useMarkers";

interface MarkerProps {
  marker: Marker;
}

export const MarkerElement = (props: MarkerProps) => {
  const { marker } = props;

  return (
    <View
      style={[
        styles.marker,
        {
          /* (x,y) should be the center of the marker */
          left: marker.x - styles.marker.width / 2,
          top: marker.y - styles.marker.height / 2,
        },
      ]}
    >
      <View style={styles.markerDot} />
      <Text style={styles.markerCount}>{marker.photos.length}</Text>
    </View>
  );
};
