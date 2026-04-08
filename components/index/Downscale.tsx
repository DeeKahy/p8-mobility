// Courtesy of https://glazzes.github.io/react-native-zoom-toolkit/guides/downscale.html

import React from "react";
import type { ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

type DownscaleProps = React.PropsWithChildren<{
  scale: SharedValue<number>;
  style?: ViewStyle;
}>;

const Downscale = ({ scale, style, children }: DownscaleProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 / scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
};

export default Downscale;
