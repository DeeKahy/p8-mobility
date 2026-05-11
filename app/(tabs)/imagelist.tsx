import { View } from "react-native";

import FloorplanHeader from "../../components/FloorplanHeader";
import { PhotoList } from "../../components/photos_list";
import { useFloorplan } from "../../context/FloorplanContext";
import { styles } from "../../css/indexStyle";

export default function ImagesScreen() {
  const { markers } = useFloorplan();
  const photos = markers.flatMap((marker) => marker.photos);
  return (
    <View style={styles.container}>
      <FloorplanHeader showHelpButton />
      <PhotoList photoList={photos} />
    </View>
  );
}
