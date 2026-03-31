import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { FloorplanProvider } from "../../context/FloorplanContext";

export default function TabLayout() {
  return (
    <FloorplanProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2196F3",
        }}
      >
        <Tabs.Screen
          name="camera"
          options={{
            title: "Camera",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="camera" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Floorplan",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="main"
          options={{
            title: "Main page",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="menu" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="debug"
          options={{
            title: "debug",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bug" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </FloorplanProvider>
  );
}
