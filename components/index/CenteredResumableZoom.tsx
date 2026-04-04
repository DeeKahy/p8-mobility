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

// NEW IDEA:
// Let padding be constant. Detect when a gesture ends with the "camera" too far away from the allowed area.
// Use onGestureEnd and the scale, translateX and translateY values from the state.
// Absolute values of tX and tY unscaled should never be larger than half the container size. Maybe.
// Use setTransformState to animate back to an allowed position.
// This will not be as precise, so rely on the marker placement setup to define valid placement areas.
// That's fine. Our job is just to keep the floor plan on the screen now.
// Maybe set decay:false on RZ to make the correction happen faster.

// OR:
// Discard the padding idea and instead let the wrapped element take up a percentage of the available space.
// e.g. at 1 scale, the element takes up half of the width and height of the parent.
// (Using style.width and style.height is probably easier, but one could figure something out with dual-axis flex?)
// At larger scales, the wrapped element scales up faster than its wrapper, which avoids resizing said wrapper and dealing with most of ResumableZoom's jank.
// The relationship between inner and outer scale could be something like: Di(s) = Do(s) - (1-r)*Do(1)
// Read as "Inner dimension at scale s equals the outer dimension at scale s minus the initial outer dimension times 1 minues the initial ratio r of the dimensions."
// Substitute D for width or height, or use D to scale directly which might be the best choice?.
// With the initial inner element being 50% of the outer one, r=0. If it was 60%, then r=0.6, and so on.
// onUpdate seems like the obvious choice to detect when a resizing might be needed. But only resize when scale changes!
// Be careful with this solution if downscaling markers by the ResumableZoom's scale, since will still grow faster than that!
// Expose the scale of the inner component as well, perhaps? That way a downscaler can use that number instead and everyone is happy.
