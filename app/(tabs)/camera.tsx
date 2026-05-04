import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";

import { CameraUI } from "../../components/CameraUI";
import { CameraMode, useCamera } from "../../context/CameraContext";

const DEFAULT_MODE = CameraMode.Placement; // Camera-first marker placement is the default

export default function CameraScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { captureMode, setCaptureMode, setCapturedImage } = useCamera();

  const onPictureTaken = (uri: string) => {
    // Adjust the mode, set the URI, and jump to the default tab, which is index.tsx
    switch (captureMode) {
      //STUB: Add more cases as needed.
      case CameraMode.None: // With mode specified we use the default
        setCaptureMode(DEFAULT_MODE);
        break;
    }
    setCapturedImage(uri);
    router.navigate("/");
  };

  return isFocused ? <CameraUI onPictureTaken={onPictureTaken} /> : null;
}
