import React, { useEffect } from "react";
import { Text, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

type ToastType = "Success" | "Error" | "Info";

type ToastMessage = {
  type: ToastType;
  message: string;
  onRemove: () => void;
};

const getTypeColor = (type: ToastType) => {
  switch (type) {
    case "Success":
      return "#19ae75";
    case "Error":
      return "#ff3355";
    case "Info":
      return "#074799";
  }
};

const FADE_IN_MS = 500;
const IDLE_MS = 2500;
const FADE_OUT_MS = 1000;

const FADE_IN_OPTIONS = {
  duration: FADE_IN_MS,
  easing: Easing.out(Easing.cubic),
};
const FADE_OUT_OPTIONS = {
  duration: FADE_OUT_MS,
  easing: Easing.in(Easing.cubic),
};

export const Toast = (props: ToastMessage) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      // Fade in
      withTiming(1, FADE_IN_OPTIONS),
      // Wait
      withDelay(
        IDLE_MS,
        // Fade out and run onRemove not on the UI thread
        withTiming(0, FADE_OUT_OPTIONS, () => scheduleOnRN(props.onRemove))
      )
    );
  }, []);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <SafeAreaProvider>
      <Animated.View
        style={[
          opacityStyle,
          styles.container,
          { backgroundColor: getTypeColor(props.type) },
        ]}
      >
        <Text style={styles.typetext}>{props.type}</Text>
        <Text style={styles.text}>{props.message}</Text>
      </Animated.View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 10,
    elevation: 5,
  },
  text: {
    fontSize: 20,
    color: "white",
    textAlign: "center",
  },
  typetext: {
    fontSize: 20,
    color: "white",
    textAlign: "center",
  },
});
