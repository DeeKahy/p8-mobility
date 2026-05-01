import { useRouter } from "expo-router";

import { CameraUI } from "../../components/CameraUI";
import { useFloorplan } from "../../context/FloorplanContext";

export default function CameraScreen() {
  const router = useRouter();
  const { setImageToPlace } = useFloorplan();
  return (
    <CameraUI
      onPictureTaken={(uri: string) => {
        setImageToPlace(uri);
        router.navigate("/"); // Jump to the default tab, which is index.tsx
      }}
    />
  );
}
