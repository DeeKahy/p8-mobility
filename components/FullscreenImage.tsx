import { Dispatch, SetStateAction } from "react";
import { StyleSheet, Image } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import {
  fitContainer,
  ResumableZoom,
  useImageResolution,
} from "react-native-zoom-toolkit";

import { Overlay } from "../context/Overlays";

interface FullscreenImageProps {
  uri: string;
  setUri: Dispatch<SetStateAction<string>>;
}

// Component that displays a zoomable image and unsets the URI when a tap happens outside the image.
const FullscreenImage = ({ uri, setUri }: FullscreenImageProps) => {
  const IMAGE_SIZE = 400;
  const exit = () => {
    setUri("");
  };

  const { resolution } = useImageResolution({ uri });
  if (!resolution?.height) return null; // Height must be defined and nonzero
  const aspectRatio = resolution.width / resolution.height;
  // Enforce the aspect ratio for the image. Equivalent to the expressions at the bottom of this file.
  const { width, height } = fitContainer(aspectRatio, {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  });

  return (
    <Overlay
      style={{
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0000005b",
      }}
      animationType="fade"
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={exit} />
      <ResumableZoom style={{ maxWidth: "80%", maxHeight: "80%" }}>
        <Image
          source={{ uri }}
          style={{
            width,
            height,
            backgroundColor: "#0000005b",
          }}
          resizeMethod="scale"
          resizeMode="contain"
        />
      </ResumableZoom>
    </Overlay>
  );
};

export default FullscreenImage;

//const width = aspectRatio < 1 ? IMAGE_SIZE * aspectRatio : IMAGE_SIZE;
//const height = aspectRatio > 1 ? IMAGE_SIZE * aspectRatio : IMAGE_SIZE;
