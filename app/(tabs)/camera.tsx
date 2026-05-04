import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { CameraUI } from "../../components/CameraUI";
import { CameraMode, useCamera } from "../../context/CameraContext";

const DEFAULT_MODE = CameraMode.Placement; // Camera-first marker placement is the default

export default function CameraScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { setCapturedImage } = useCamera();

  //NOTE the mode passed via router.push etc. will be undefined when navigating via the tabs bar.
  const { mode: modeParam } = useLocalSearchParams<{ mode: CameraMode }>();
  const [mode, setMode] = useState(DEFAULT_MODE);

  useEffect(() => {
    if (!modeParam) return;
    // Clear params immediately, but remember the mode, so tab reuse is safe
    setMode(modeParam);
    router.setParams({ mode: undefined });
  }, [modeParam]);

  const onPictureTaken = (uri: string) => {
    // Jump to the default tab, which is index.tsx, after setting the URI and echoing the mode of the captured image
    setCapturedImage({ uri, mode });
    router.navigate("/");
  };

  return isFocused ? <CameraUI onPictureTaken={onPictureTaken} /> : null;
}
