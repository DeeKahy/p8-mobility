import { Children, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import {
  ResumableZoom,
  ResumableZoomProps,
  ResumableZoomRefType,
  TapGestureEvent,
} from "react-native-zoom-toolkit";

// A component for a ResumableZoom enclosing a View that dynamically adjusts its padding.
// The center of the screen will always be on the non-padded part of the View and single tap-gestures will only be registered in that same area.
export default function CenteredResumableZoom(props: ResumableZoomProps) {
  const { onTap, onGestureEnd, children, style, ...otherProps } = props;
  const child = Children.only(children); // Like ResumableZoom, we support exactly one child and throw if we get more than that.
  const zoomRef = useRef<ResumableZoomRefType>(null); // Typescript has to know what type this will be to avoid property-does-not-exist-on-type-never.
  const [padding, setPadding] = useState({ width: 0, height: 0 });
  const wrappedSize = { width: 0, height: 0 };

  useEffect(() => {
    setTimeout(() => {
      updatePadding();
    }, 200); // If timeout is not used, the wrapped component will not show up properly inside the wrapper View.
  }, []); // One-time effect triggered to make the first padding update. Note that useLayoutEffect will be triggered too early to know containerSize.

  const updatePadding = () => {
    if (!zoomRef.current) return;
    const state = zoomRef.current.getState();
    const { containerSize, scale } = state;
    const reciprocal = 1 / scale; // Multiply a scaled value by this to get the unscaled value.
    setPadding({
      width: containerSize.width * reciprocal,
      height: containerSize.height * reciprocal,
    });
    // Too far left. Push to the right by the amount of padding that was removed.
    // Too far right. Push to the left by the amount of padding that was removed.
    // zoomRef.current.setTransformState(state); // TODO: Modify state to animate to the closest valid position.
  };

  const isInsidePadding = (x: number, y: number) => {
    if (!zoomRef.current) return false;
    const { width, height } = zoomRef.current.getState().childSize;
    const wrappedWidth = width - padding.width;
    const wrappedHeight = height - padding.height;
    return x >= 0 && x < wrappedWidth && y >= 0 && y < wrappedHeight;
  };

  return (
    <ResumableZoom
      style={style ?? styles.flex} // Default to flex:1 since that makes things work correctly.
      ref={zoomRef}
      onTap={(event: TapGestureEvent) => {
        if (onTap) {
          // TODO: This logic *could* be handled by the tap-callback instead if we expose the appropriate data.
          event.x -= padding.width / 2; // The tap event should be treated as if it occured on the wrapped component.
          event.y -= padding.height / 2; // This moves our tap into its coordinate space.
          if (isInsidePadding(event.x, event.y)) {
            onTap(event);
          }
        }
      }}
      onGestureEnd={() => {
        if (onGestureEnd) onGestureEnd();
        updatePadding();
      }}
      {...otherProps}
    >
      <View // padding View. Adds the extra space needed to keep the screen centered on the child.
        style={[
          {
            paddingHorizontal: padding.width / 2,
            paddingVertical: padding.height / 2,
          },
          styles.center,
        ]}
      >
        <View // child View. This will take the exact shape of the child, which we can then measure.
          onLayout={(event: LayoutChangeEvent) => {
            wrappedSize.width = event.nativeEvent.layout.width;
            wrappedSize.height = event.nativeEvent.layout.height;
          }}
        >
          {child}
        </View>
      </View>
    </ResumableZoom>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#f20",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00ff",
  },
});
