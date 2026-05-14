import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CameraContextProvider } from "../context/CameraContext";
import { FloorplanProvider } from "../context/FloorplanContext";
import { LoggerProvider } from "../context/LoggerContext";
import { OverlayProvider } from "../context/Overlays";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LoggerProvider>
        <CameraContextProvider>
          <OverlayProvider>
            <FloorplanProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </FloorplanProvider>
          </OverlayProvider>
        </CameraContextProvider>
      </LoggerProvider>
    </SafeAreaProvider>
  );
}
