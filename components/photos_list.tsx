import { useMemo, useState } from "react";
import { FlatList, View, Text, Image, TouchableOpacity } from "react-native";

import { styles } from "../css/photo_list";
import { PhotoData } from "../models/PhotoFormModel";
type PhotoFormProps = {
  photoList: PhotoData[];
};

export const PhotoList = ({ photoList }: PhotoFormProps) => {
  const [showPhoto, setShowPhoto] = useState<string | null>(null);
  // Without useMemo, this runs on every keystroke and any state change. Sorts based on area group
  const processedPhotos = useMemo<PhotoData[]>(() => {
    return photoList.sort((a, b) => {
      return a.areaGroup.localeCompare(b.areaGroup);
    });
  }, [photoList]);

  const showSinglePhoto = (photoToShow: string) => {
    setShowPhoto(showPhoto === photoToShow ? null : photoToShow);
  };

  const Item = ({ pictureName, dateTaken, photoUri, areaGroup }: PhotoData) => (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <Text style={styles.subtitle}>{areaGroup}</Text>
        <TouchableOpacity onPress={() => showSinglePhoto(photoUri)}>
          <Text style={styles.title}>
            {pictureName} {showPhoto === photoUri ? "<" : ">"}
          </Text>
        </TouchableOpacity>
      </View>
      {showPhoto === photoUri && (
        <View style={styles.textContainer}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: photoUri }} style={styles.image} />
          </View>
          <Text style={styles.date}>{dateTaken}</Text>
        </View>
      )}
    </View>
  );

  return (
    <>
      <FlatList
        contentContainerStyle={styles.list}
        data={processedPhotos}
        keyExtractor={(item) => item.photoUri}
        renderItem={({ item }) => (
          <Item
            pictureName={item.pictureName}
            photoUri={item.photoUri}
            dateTaken={item.dateTaken}
            areaGroup={item.areaGroup}
            description={item.description}
          />
        )}
      />
    </>
  );
};
