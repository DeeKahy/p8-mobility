import { Text, View } from "react-native";
import PieChart, { Slice } from "react-native-pie-chart";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import Downscale from "./Downscale";
import { styles } from "../../css/indexStyle";
import { Marker } from "../../hooks/useMarkers";
import { PhotoData } from "../../models/PhotoFormModel";
import { hashNameToColor } from "../../utils/stringColor";

interface MarkerProps {
  scale?: SharedValue<number>;
}
// MarkerElement can hold a Marker instance
interface MarkerPropsWithMarker extends MarkerProps {
  marker: Marker;
  x?: never;
  y?: never;
}
// or MarkerElement can hold a shared x and y-coordinate
interface MarkerPropsWithFreePosition extends MarkerProps {
  marker?: never;
  x: SharedValue<number>;
  y: SharedValue<number>;
}

export const MarkerElement = (
  props: MarkerPropsWithMarker | MarkerPropsWithFreePosition
) => {
  const DEFAULT_SCALE = useSharedValue(1); // Don't transform if scale isn't given
  const { scale = DEFAULT_SCALE } = props;

  const hashedColors = new Map<string, number>();
  const series: Slice[] = [];

  if (props.marker) {
    // Count how many times each color hash appears
    props.marker.photos.forEach((p: PhotoData) => {
      const c = hashNameToColor(p.areaGroup);
      const n = hashedColors.get(c);
      hashedColors.set(c, n ? n + 1 : 1);
    });
    // Fill out the series for the pie chart
    hashedColors.forEach((n: number, c: string) => {
      series.push({ value: n, color: c });
    });
  } else {
    series.push({ value: 1, color: "#ffffff" });
  }

  const animatedStyle = useAnimatedStyle(() => {
    return props.marker
      ? {
          /* (x,y) should be the center of the marker */
          left: props.marker.x - styles.marker.width / 2,
          top: props.marker.y - styles.marker.height / 2,
        }
      : {
          /* If no marker is given, use the x and y-values shared with us */
          transform: [
            { translateX: props.x.value - styles.marker.width / 2 },
            { translateY: props.y.value - styles.marker.height / 2 },
          ],
        };
  });

  return (
    <Animated.View style={[styles.marker, animatedStyle]}>
      <Downscale scale={scale}>
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
        {props.marker ? (
          <Text style={styles.markerCount}>{series.length}</Text>
        ) : null}
      </Downscale>
    </Animated.View>
  );
};
