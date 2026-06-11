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
import { scheduleOnRN } from "react-native-worklets";

import { ToastMessage, ToastType } from "../context/Overlays";

type ToastProps = ToastMessage & {
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
const FADE_OUT_MS = 1000;
const MIN_IDLE_MS = 2000;
const BASE_IDLE_MS = 1000;
const MAX_IDLE_MS = 8000;
const MS_PER_CHAR = 50;

const FADE_IN_OPTIONS = {
  duration: FADE_IN_MS,
  easing: Easing.out(Easing.cubic),
};
const FADE_OUT_OPTIONS = {
  duration: FADE_OUT_MS,
  easing: Easing.in(Easing.cubic),
};

/* Estimate the duration needed to read the text in the toast.
Duration is clamped between MIN_IDLE_MS and MAX_IDLE_MS. */
const getIdleDuration = (text: string) => {
  const duration = BASE_IDLE_MS + MS_PER_CHAR * text.length;
  return Math.min(MAX_IDLE_MS, Math.max(MIN_IDLE_MS, duration));
};

export const Toast = ({ message, type, title, onRemove }: ToastProps) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      // Fade in
      withTiming(1, FADE_IN_OPTIONS),
      // Wait
      withDelay(
        getIdleDuration(message + title),
        // Fade out and run onRemove not on the UI thread
        withTiming(0, FADE_OUT_OPTIONS, () => scheduleOnRN(onRemove))
      )
    );
  }, []);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        opacityStyle,
        styles.container,
        { backgroundColor: getTypeColor(type) },
      ]}
    >
      <Text style={styles.text}>{title}</Text>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
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
});
