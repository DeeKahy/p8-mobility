import { Children, useRef, useState } from "react";
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

  const updatePadding = () => {
    if (!zoomRef.current) return;
    const { scale, containerSize } = zoomRef.current.getState();
    setPadding({
      width: containerSize.width * (1 / scale),
      height: containerSize.height * (1 / scale),
    });
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
        if (onGestureEnd) onGestureEnd(); // REVIEW: Callback first or padding update first?
        updatePadding();
      }}
      style={style ?? styles.flex} // Default to flex:1 since that makes things work correctly.
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
// Shrink padding as View expands? So padding always looks like container's dimensions:
// At neutral scaling i.e. View is its original size, padding multiplier is 1.
// At large scaling i.e. View is zoomed in/larger, padding multiplier is <1.
// At small scaling i.e. View is zoomed out/smaller, padding multiplier is >1.
