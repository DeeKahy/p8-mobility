import { Ionicons } from "@expo/vector-icons";
import { Dispatch, SetStateAction } from "react";
import { StyleSheet, Image, View, TouchableOpacity } from "react-native";
import {
  fitContainer,
  ResumableZoom,
  useImageResolution,
  useTransformationState,
} from "react-native-zoom-toolkit";

import { Overlay } from "../context/Overlays";
import Downscale from "./index/Downscale";

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
  const { onUpdate: onResumableUpdate, state: resumableState } =
    useTransformationState("resumable");

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
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={exit} />
      <ResumableZoom
        onUpdate={onResumableUpdate}
        style={{ maxWidth: "80%", maxHeight: "80%" }}
      >
        <View
          style={{
            width,
            height,
          }}
        >
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
          <Downscale
            style={{
              position: "absolute",
              alignSelf: "flex-end",
              top: -15,
              right: -15,
            }}
            scale={resumableState.scale}
          >
            <TouchableOpacity
              onPress={exit}
              style={{
                backgroundColor: "#ff3355",
                borderRadius: "50%",
              }}
            >
              <Ionicons name="close-outline" size={30} color="#ffffff" />
            </TouchableOpacity>
          </Downscale>
        </View>
      </ResumableZoom>
    </Overlay>
  );
};

export default FullscreenImage;

//const width = aspectRatio < 1 ? IMAGE_SIZE * aspectRatio : IMAGE_SIZE;
//const height = aspectRatio > 1 ? IMAGE_SIZE * aspectRatio : IMAGE_SIZE;
