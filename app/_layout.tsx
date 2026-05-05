import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CameraContextProvider } from "../context/CameraContext";
import { FloorplanProvider } from "../context/FloorplanContext";
import { LoggerProvider } from "../context/LoggerContext";
import { ToastProvider } from "../context/ToastProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LoggerProvider>
        <CameraContextProvider>
          <ToastProvider>
            <FloorplanProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </FloorplanProvider>
          </ToastProvider>
        </CameraContextProvider>
      </LoggerProvider>
    </SafeAreaProvider>
  );
}
