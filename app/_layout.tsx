import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import FloatingHelpButton from "../components/FloatingHelpButton";
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
              <View style={{ flex: 1 }}>
                <Stack screenOptions={{ headerShown: false }} />
                <FloatingHelpButton />
              </View>
            </FloorplanProvider>
          </ToastProvider>
        </CameraContextProvider>
      </LoggerProvider>
    </SafeAreaProvider>
  );
}
