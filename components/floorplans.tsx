import { Directory, Paths, File } from "expo-file-system";
import { useState } from "react";
import {
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";

import { useToast } from "../context/ToastProvider";
import { styles } from "../css/floorplanillustrator";

type PickPlan = {
  photoUri: string;
  pickFloorPlan: (photoUri: string) => void;
  onDelete: (uri: string) => void;
  name?: string;
};

const Item = ({ photoUri, pickFloorPlan, onDelete, name }: PickPlan) => (
  <View style={styles.card}>
    <Image
      source={{ uri: photoUri }}
      style={styles.image}
      resizeMode="contain"
    />
    <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
      {name || photoUri}
    </Text>
    <View style={styles.buttonRow}>
      <TouchableOpacity
        onPress={() => pickFloorPlan(photoUri)}
        style={styles.rowButton}
      >
        <Text style={styles.buttonText}>Use Floor Plan</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onDelete(photoUri)}
        style={[styles.rowButton, styles.deleteButton]}
      >
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default (props: PickPlan) => {
  const { showToast } = useToast();
  const imagesDirectory = new Directory(Paths.document, "floorplan-images");

  const getFloorplanNameFromUri = (photoUri: string) => {
    try {
      const fileName = photoUri.split("/").pop() || "";
      const match = fileName.match(/^floorplan-\d+-(.+)\.png$/);
      if (!match) {
        return "Unnamed Floorplan";
      }

      return decodeURIComponent(match[1]).replace(/_/g, " ");
    } catch {
      return "Unnamed Floorplan";
    }
  };

  const getImagesFromCache = () => {
    if (!imagesDirectory.exists) return;
    return imagesDirectory.list().map((file) => file.uri);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [images, setImages] = useState<string[] | undefined>(
    getImagesFromCache
  );

  if (getImagesFromCache()?.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Floor Plans</Text>
        <Text style={styles.empty}>
          No floor plans found. Please create one in the AR tab.
        </Text>
      </View>
    );
  }

  const onDelete = (photoUri: string) => {
    Alert.alert(
      "Delete Floor Plan",
      "Are you sure you want to delete this floorplan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onConfirmDelete(photoUri),
        },
      ]
    );
  };

  const onConfirmDelete = (photoUri: string) => {
    try {
      const uriFile = new File(photoUri);
      if (uriFile) {
        uriFile.delete();
        setImages((uris) => uris?.filter((uri) => uri !== photoUri));
        showToast("Image has been deleted", "Success");
      }
    } catch (error) {
      showToast("Image could not be deleted", "Error");
      throw new Error("Could not delete" + error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Floor Plans</Text>
      <FlatList
        data={getImagesFromCache()}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Item
            photoUri={item}
            pickFloorPlan={props.pickFloorPlan}
            onDelete={onDelete}
            name={getFloorplanNameFromUri(item)}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};
