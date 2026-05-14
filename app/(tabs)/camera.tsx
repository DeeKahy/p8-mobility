import { useIsFocused } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef } from "react";

import { CameraUI } from "../../components/CameraUI";
import { CameraMode, useCamera } from "../../context/CameraContext";

const DEFAULT_MODE = CameraMode.Placement; // Camera-first marker placement is the default

export default function CameraScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { captureMode, setCapturedImage } = useCamera();

  const pictureTaken = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // useCallback prevents effect from triggering on re-renders e.g. state updates
      pictureTaken.current = false;
      switch (captureMode.current) {
        //STUB: Add more cases as needed.
        case CameraMode.None: // With no mode specified we use the default
          captureMode.current = DEFAULT_MODE;
          break;
      }
      return () => {
        // Unset mode if no picture was taken and user leaves the tab
        if (pictureTaken.current === false) {
          captureMode.current = CameraMode.None;
        }
      };
    }, [])
  );

  const onPictureTaken = (uri: string) => {
    // Adjust the mode, set the URI, and jump to the default tab, which is index.tsx
    pictureTaken.current = true;
    setCapturedImage(uri);
    router.navigate("/");
  };

  return isFocused ? <CameraUI onPictureTaken={onPictureTaken} /> : null;
}
