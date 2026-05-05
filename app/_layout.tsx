import { Stack } from "expo-router";
import { View } from "react-native";

import FloatingHelpButton from "../components/FloatingHelpButton";
import { FloorplanProvider } from "../context/FloorplanContext";
import { LoggerProvider } from "../context/LoggerContext";
import { ToastProvider } from "../context/ToastProvider";

export default function RootLayout() {
  return (
    <LoggerProvider>
      <ToastProvider>
        <FloorplanProvider>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
            <FloatingHelpButton />
          </View>
        </FloorplanProvider>
      </ToastProvider>
    </LoggerProvider>
  );
}
