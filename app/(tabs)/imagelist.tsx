import { router } from "expo-router";
import { useState } from "react";
import { TouchableOpacity, View, Text, Image, SectionList } from "react-native";

import FloorplanHeader from "../../components/FloorplanHeader";
import { useFloorplan } from "../../context/FloorplanContext";
import { styles as indexStyles } from "../../css/indexStyle";
import { styles } from "../../css/photo_list";
import { Marker } from "../../hooks/useMarkers";
import { PhotoData } from "../../models/PhotoFormModel";
import { hashNameToColor } from "../../utils/stringColor";

enum SortBy {
  Group,
  Marker,
}

interface SectionData {
  section: {
    key: string;
    data: PhotoData[];
  };
}

// Sections are what will be used to generate the list, including the section header components
const makeMarkerSections = (markers: Marker[]) => {
  return markers.map((marker) => ({
    key: marker.id,
    data: marker.photos,
    markerX: marker.x,
    markerY: marker.y,
  }));
};

const makeGroupSections = (markers: Marker[]) => {
  const groups = new Map<string, PhotoData[]>();
  const sections: { key: string; data: PhotoData[] }[] = [];
  // Split photos up according to their group
  markers.forEach((marker) => {
    marker.photos.forEach((p: PhotoData) => {
      const ps = groups.get(p.areaGroup) ?? [];
      ps.push(p);
      groups.set(p.areaGroup, ps);
    });
  });
  // Make sections with groupName as keys
  groups.forEach((photos, groupName) => {
    sections.push({
      key: groupName,
      data: photos,
    });
  });
  return sections;
};

export default function ImagesScreen() {
  const { markers, setSelectedMarkerId } = useFloorplan();
  const [sortBy, setSortBy] = useState(SortBy.Marker);

  const MarkerHeader = ({ section: { key } }: SectionData) => {
    return (
      <TouchableOpacity
        style={{ borderRadius: "50%" }}
        onPress={() => {
          setSelectedMarkerId(key);
          router.navigate("/");
        }}
      >
        <Text style={indexStyles.headerButton}>Go to marker</Text>
      </TouchableOpacity>
    );
  };

  const GroupHeader = ({ section: { key } }: SectionData) => {
    return (
      <View
        style={{
          borderRadius: "50%",
          backgroundColor: hashNameToColor(key),
        }}
      >
        <Text style={indexStyles.headerButton}>{key}</Text>
      </View>
    );
  };

  const SectionItem = ({
    pictureName,
    dateTaken,
    photoUri,
    areaGroup,
  }: PhotoData) => (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <Text style={styles.subtitle}>{areaGroup}</Text>
      </View>
    </View>
  );

  return (
    <View style={indexStyles.container}>
      <FloorplanHeader showHelpButton />
      <SectionList
        sections={
          sortBy === SortBy.Group
            ? makeGroupSections(markers)
            : makeMarkerSections(markers)
        }
        renderItem={({ item }) => SectionItem(item)}
        renderSectionHeader={
          sortBy === SortBy.Group ? GroupHeader : MarkerHeader
        }
      />
    </View>
  );
}
