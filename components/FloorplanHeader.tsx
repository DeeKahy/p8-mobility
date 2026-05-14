import { router } from "expo-router";
import { TouchableOpacity, View, Text } from "react-native";

import FloatingHelpButton from "./FloatingHelpButton";
import { useFloorplan } from "../context/FloorplanContext";
import { styles } from "../css/indexStyle";

interface FloorplanHeaderProps {
  showHelpButton?: boolean;
}

const FloorplanHeader = ({ showHelpButton = false }: FloorplanHeaderProps) => {
  const { setFloorplan } = useFloorplan();

  return (
    <View style={styles.header}>
      {showHelpButton ? <FloatingHelpButton /> : null}
      <Text
        style={styles.headerTitle}
      >{`${showHelpButton ? "      " : ""}Floor Plan`}</Text>
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
