// Courtesy of https://glazzes.github.io/react-native-zoom-toolkit/guides/downscale.html
// This component is meant to be used alongside zoom-components to undo undesired scaling.
import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  AnimatedStyle,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

type DownscaleProps = React.PropsWithChildren<{
  scale: SharedValue<number>;
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>; // Same type used by Animated.View
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
