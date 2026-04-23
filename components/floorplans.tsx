import {
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useToast } from "../context/ToastProvider";
import { styles } from "../css/floorplanillustrator";
import { FloorplanImage } from "../utils/types";

interface FloorplanListProps {
  floorplans: FloorplanImage[];
  isLoading: boolean;
  pickFloorPlan: (storedFloorplan: FloorplanImage) => void | Promise<void>;
  onDeleteFloorPlan: (storedFloorplan: FloorplanImage) => Promise<void> | void;
}

interface FloorplanCardProps {
  storedFloorplan: FloorplanImage;
  pickFloorPlan: (storedFloorplan: FloorplanImage) => void | Promise<void>;
  onDeleteFloorPlan: (storedFloorplan: FloorplanImage) => Promise<void> | void;
}

const FloorplanCard = ({
  storedFloorplan,
  pickFloorPlan,
  onDeleteFloorPlan,
}: FloorplanCardProps) => (
  <View style={styles.card}>
    <Image
      source={{ uri: storedFloorplan.imageUri }}
      style={styles.image}
      resizeMode="contain"
    />
    <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
      {storedFloorplan.imageName}
    </Text>
    <TouchableOpacity
      onPress={() => {
        pickFloorPlan(storedFloorplan);
      }}
      style={[styles.button]}
    >
      <Text>Use Floor Plan</Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => {
        onDeleteFloorPlan(storedFloorplan);
      }}
      style={[styles.button]}
    >
      <Text>Delete Floor Plan</Text>
    </TouchableOpacity>
  </View>
);

export default function FloorplanList({
  floorplans,
  isLoading,
  pickFloorPlan,
  onDeleteFloorPlan,
}: FloorplanListProps) {
  const { showToast } = useToast();

  const confirmDeleteFloorplan = (storedFloorplan: FloorplanImage) => {
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await onDeleteFloorPlan(storedFloorplan);
            showToast("Image has been deleted", "Success");
          } catch (error) {
            showToast("Image could not be deleted", "Error");
            throw new Error(`Could not delete floorplan: ${String(error)}`);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Floor Plans</Text>
        <Text style={styles.empty}>Loading floor plans...</Text>
      </View>
    );
  }

  if (floorplans.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Floor Plans</Text>
        <Text style={styles.empty}>
          No floor plans found. Please create one in the AR tab.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Floor Plans</Text>
      <FlatList
        data={floorplans}
        keyExtractor={(storedFloorplan) => storedFloorplan.id}
        renderItem={({ item }) => (
          <FloorplanCard
            storedFloorplan={item}
            pickFloorPlan={pickFloorPlan}
            onDeleteFloorPlan={confirmDeleteFloorplan}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}
