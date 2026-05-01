import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FloorplanProvider } from "../context/FloorplanContext";
import { LoggerProvider } from "../context/LoggerContext";
import { ToastProvider } from "../context/ToastProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LoggerProvider>
        <ToastProvider>
          <FloorplanProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </FloorplanProvider>
        </ToastProvider>
      </LoggerProvider>
    </SafeAreaProvider>
  );
}
