import { Directory, Paths, File } from "expo-file-system";
import { useState } from "react";
import { Text, View, FlatList, Image, TouchableOpacity } from "react-native";

import { useToast } from "../context/ToastProvider";
import { styles } from "../css/floorplanillustrator";

type PickPlan = {
  photoUri: string;
  pickFloorPlan: (photoUri: string) => void;
  onDelete: (uri: string) => void;
};

const Item = ({ photoUri, pickFloorPlan, onDelete }: PickPlan) => (
  <View style={styles.card}>
    <Image
      source={{ uri: photoUri }}
      style={styles.image}
      resizeMode="contain"
    />
    <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
      {photoUri}
    </Text>
    <TouchableOpacity onPress={() => pickFloorPlan(photoUri)}>
      <Text>Use Floor Plan</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => onDelete(photoUri)}>
      <Text>Delete Floor Plan</Text>
    </TouchableOpacity>
  </View>
);

export default (props: PickPlan) => {
  const { showToast } = useToast();
  const imagesDirectory = new Directory(Paths.document, "floorplan-images");

  const getImagesFromCache = () => {
    if (!imagesDirectory.exists) return;
    return imagesDirectory.list().map((file) => file.uri);
  };

  const [images, setImages] = useState<string[] | undefined>(
    getImagesFromCache
  );

  const onDelete = (photoUri: string) => {
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
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};
