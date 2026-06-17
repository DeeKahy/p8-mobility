import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { TouchableOpacity, View, Text, ActivityIndicator } from "react-native";

import FloatingHelpButton from "./FloatingHelpButton";
import { useFloorplan } from "../context/FloorplanContext";
import { styles } from "../css/indexStyle";

interface FloorplanHeaderProps {
  showHelpButton?: boolean;
}

const CLOUD_INDICATOR_SIZE = 28;

const FloorplanHeader = ({ showHelpButton = false }: FloorplanHeaderProps) => {
  const { setFloorplan, isSyncingMarkers } = useFloorplan();

  return (
    <View style={styles.header}>
      {showHelpButton ? <FloatingHelpButton /> : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginLeft: CLOUD_INDICATOR_SIZE,
          gap: 12,
        }}
      >
        {isSyncingMarkers ? ( // Show a spinner if the server is working, otherwise show a checkmark
          <ActivityIndicator size={CLOUD_INDICATOR_SIZE} color="#2196F3" />
        ) : (
          <Ionicons
            name="cloud-done-sharp"
            size={CLOUD_INDICATOR_SIZE}
            color="#2196F3"
          />
        )}
        <Text style={styles.headerTitle}>Floor Plan</Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          setFloorplan(null);
          router.navigate("/");
        }}
      >
        <Text style={styles.headerButton}>Go back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FloorplanHeader;
