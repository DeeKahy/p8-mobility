import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useFloorplan } from "../../context/FloorplanContext";

export default function TabLayout() {
  const { floorplan: enableCamera } = useFloorplan();
  const enableAR = !enableCamera;

  return (
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
          href: enableCamera ? "/camera" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ar"
        options={{
          title: "AR scan",
          href: enableAR ? "/ar" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Floor plan",
          href: "/",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
