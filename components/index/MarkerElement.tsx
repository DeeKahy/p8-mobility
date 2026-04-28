import { useEffect } from "react";
import { Text } from "react-native";
import PieChart, { Slice } from "react-native-pie-chart";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import Downscale from "./Downscale";
import { styles } from "../../css/indexStyle";
import { Marker } from "../../hooks/useMarkers";
import { PhotoData } from "../../models/PhotoFormModel";
import { hashNameToColor } from "../../utils/stringColor";

interface MarkerProps {
  highlight?: boolean;
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

const MAX_HIGHLIGHT_SCALE = 1.25;
const BASE_HIGHTLIGHT_SCALE = 1;
const HIGHTLIGHT_LOOP_MS = 400;

export const MarkerElement = (
  props: MarkerPropsWithMarker | MarkerPropsWithFreePosition
) => {
  const DEFAULT_SCALE = useSharedValue(1); // Don't transform if scale isn't given
  const extraScale = useSharedValue(BASE_HIGHTLIGHT_SCALE);
  const { marker, highlight = false, scale = DEFAULT_SCALE } = props;

  const hashedColors = new Map<string, number>();
  const series: Slice[] = [];

  if (marker) {
    // Count how many times each color hash appears
    marker.photos.forEach((p: PhotoData) => {
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

  useEffect(() => {
    // Start highlight animation on mount
    if (highlight) {
      extraScale.value = withRepeat(
        withTiming(MAX_HIGHLIGHT_SCALE, {
          duration: HIGHTLIGHT_LOOP_MS,
          easing: Easing.inOut(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
        -1,
        true,
        (notCancelled) => {
          if (!notCancelled) {
            const duration =
              ((BASE_HIGHTLIGHT_SCALE - extraScale.value) /
                (BASE_HIGHTLIGHT_SCALE - MAX_HIGHLIGHT_SCALE)) *
              HIGHTLIGHT_LOOP_MS;
            extraScale.value = withTiming(BASE_HIGHTLIGHT_SCALE, {
              duration,
              reduceMotion: ReduceMotion.System,
            });
          }
        }
      );
    } else {
      // Stop animation if element highlighting is off
      cancelAnimation(extraScale);
    }
  }, [highlight]);

  const outerAnimatedStyle = useAnimatedStyle(() => {
    return {
      /* (x,y) should be the center of the marker so we transform backwards by half its width and height */
      /* If no marker is given, use the x and y-values shared with us instead */
      transform: [
        {
          translateX:
            (marker ? marker.x : props.x.value) - styles.marker.width / 2,
        },
        {
          translateY:
            (marker ? marker.y : props.y.value) - styles.marker.height / 2,
        },
      ],
    };
  });

  const innerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: extraScale.value }],
    };
  });

  return (
    <Animated.View style={[styles.marker, outerAnimatedStyle]}>
      <Downscale scale={scale}>
        <Animated.View
          style={[
            {
              borderRadius: "50%",
              backgroundColor: "#ffffff",
            },
            innerAnimatedStyle,
          ]}
        >
          <PieChart
            widthAndHeight={(styles.marker.width * 2) / 3}
            series={series}
            style={{ transform: [{ scale: 0.9 }] }}
            cover={{ radius: 0.4 }} // This fraction of the radius is transparent
            padAngle={0.1} // Slices are separated by this much
          />
        </Animated.View>
        {props.marker ? (
          <Text style={styles.markerCount}>{series.length}</Text>
        ) : null}
      </Downscale>
    </Animated.View>
  );
};
