import { Stack } from "expo-router";

import { FloorplanProvider } from "../context/FloorplanContext";
import { LoggerProvider } from "../context/LoggerContext";
import { ToastProvider } from "../context/ToastProvider";

export default function RootLayout() {
  return (
    <LoggerProvider>
      <ToastProvider>
        <FloorplanProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </FloorplanProvider>
      </ToastProvider>
    </LoggerProvider>
  );
}
