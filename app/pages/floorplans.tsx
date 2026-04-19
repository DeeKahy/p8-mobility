import { Text, View, FlatList, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { styles } from "../../css/floorplanillustrator";
import { useMemo } from "react";

type ItemProps = { photoUri: string };

const Item = ({ photoUri }: ItemProps) => (
  <View style={styles.card}>
    <Image source={{ uri: photoUri }} style={styles.image} resizeMode="contain" />
    <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
      {photoUri}
    </Text>
  </View>
);

export default () => {
  const { floorPlanImages } = useLocalSearchParams();
  //Had an issue with it being parsed as a string parameter, but i could not perform any string operations on it.
  //The data gets sent as string when using useLocalSearchParams to get data from one file to another, and so i have to turn the string to a list instead.
  //From the other component: '["file2...","file1..."]', so i have to parse and the rest is just checking if what is in the list is valid strings.
  const images = useMemo(() => {
    if (typeof floorPlanImages !== "string") return [];
    try {
      const parsedImages = JSON.parse(floorPlanImages);
      return Array.isArray(parsedImages) ? parsedImages.filter((x): x is string => typeof x === "string") : [];
    } catch (error) {
      return [];      
    }
  }, [floorPlanImages])



  return (
    <View style={styles.container}>
      <Text style={styles.header}>Floor Plans</Text>
      <FlatList
        data={images}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Item photoUri={item} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};