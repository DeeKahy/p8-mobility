import { Stack } from 'expo-router';
import { LoggerProvider } from '../context/LoggerContext';

export default function RootLayout() {
  return (
    <LoggerProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </LoggerProvider>
  );
}