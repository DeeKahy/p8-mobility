import { Text, View } from "react-native";
import PieChart from "react-native-pie-chart";
import { SharedValue, useSharedValue } from "react-native-reanimated";

import Downscale from "./Downscale";
import { styles } from "../../css/indexStyle";
import { Marker } from "../../hooks/useMarkers";
import { PhotoData } from "../../models/PhotoFormModel";
import { hashNameToColor } from "../../utils/stringColor";

interface MarkerProps {
  marker: Marker;
  scale?: SharedValue<number>;
}

export const MarkerElement = (props: MarkerProps) => {
  const DEFAULT_SCALE = useSharedValue(1); // Don't transform if scale isn't given.
  const { marker, scale = DEFAULT_SCALE } = props;

  const { photos } = marker;
  const hashedColors = new Map<string, number>();
  const series = [];

  // Count how many times each color hash appears.
  photos.forEach((p: PhotoData) => {
    const c = hashNameToColor(p.areaGroup);
    const n = hashedColors.get(c);
    hashedColors.set(c, n ? n + 1 : 1);
  });
  // Fill out the series for the pie chart
  hashedColors.forEach((n: number, c: string) => {
    series.push({ value: n, color: c });
  });
  if (!series.length) {
    // Add this in case nothing else was added
    series.push({ value: 1, color: "#ffffff" });
  }

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
      <View
        style={{
          borderRadius: "50%",
          backgroundColor: "#ffffff",
        }}
      >
        <PieChart
          widthAndHeight={(styles.marker.width * 2) / 3}
          series={series}
          style={{ transform: [{ scale: 0.9 }] }}
          cover={{ radius: 0.4 }} // This fraction of the radius is transparent
          padAngle={0.1} // Slices are separated by this much
        />
      </View>
      <Text style={styles.markerCount}>{marker.photos.length}</Text>
    </Downscale>
  );
};
