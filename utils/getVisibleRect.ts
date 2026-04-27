import {
  SizeVector,
  Vector,
  Rect,
  CommonZoomState,
} from "react-native-zoom-toolkit/lib/typescript/src/commons/types";

type Options = {
  scale: number;
  translation: Vector<number>; // cartesian system values with the y axis flipped
  itemSize: SizeVector<number>; // Size of the wrapped component
  containerSize: SizeVector<number>; // Size of zoom component
};

// react-native-zoom-toolkit does not export getVisibleRect.
// This file provides a version adapted to work independently of any zoom components.

// Original getVisibleRect implementation
const getVisibleRect = (options: Options): Rect => {
  "worklet";

  const { scale, translation, itemSize, containerSize } = options;

  const offsetX = (itemSize.width * scale - containerSize.width) / 2;
  const offsetY = (itemSize.height * scale - containerSize.height) / 2;
  const clampedX = Math.max(offsetX, 0);
  const clampedY = Math.max(offsetY, 0);

  const reducerX = (-1 * translation.x + clampedX) / (itemSize.width * scale);
  const reducerY = (-1 * translation.y + clampedY) / (itemSize.height * scale);

  const x = itemSize.width * reducerX;
  const y = itemSize.height * reducerY;

  const width =
    itemSize.width *
    Math.min(1, containerSize.width / (itemSize.width * scale));

  const height =
    itemSize.height *
    Math.min(1, containerSize.height / (itemSize.height * scale));

  return { x, y, width, height };
};

// Adapter to use it with a CommonZoomState
// NOTE that in order to properly update an animatedStyle, we can't just pass the state itself
export const getVisibleRectFromState = ({
  scale,
  childSize,
  containerSize: rootSize,
  translateX,
  translateY,
}: CommonZoomState<number>): Rect => {
  "worklet";
  return getVisibleRect({
    scale,
    itemSize: {
      width: childSize.width,
      height: childSize.height,
    },
    containerSize: {
      width: rootSize.width,
      height: rootSize.height,
    },
    translation: { x: translateX, y: translateY },
  });
};
