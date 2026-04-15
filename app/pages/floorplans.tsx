import { Text, View, FlatList, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { styles } from "../../css/floorplanillustrator";

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
  const images = String(floorPlanImages).split(',');

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