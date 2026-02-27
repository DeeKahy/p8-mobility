import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2196F3',
      }}
    >
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Floorplan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="main"
        options={{
          title: 'Main page',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="Main" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bug"
        options={{
          title: 'Bug',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bug" size={size} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}