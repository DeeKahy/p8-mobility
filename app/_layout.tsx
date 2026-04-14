import { Stack } from "expo-router";

import { LoggerProvider } from '../context/LoggerContext';
import { ToastProvider } from '../context/ToastProvider';

export default function RootLayout() {
  return (
    <LoggerProvider>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ToastProvider>
    </LoggerProvider>
  );
}
