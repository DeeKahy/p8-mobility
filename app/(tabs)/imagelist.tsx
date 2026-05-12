import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { TouchableOpacity, View, Text, SectionList, Image } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import PieChart from "react-native-pie-chart";
import { SnapbackZoom } from "react-native-zoom-toolkit";

import FloorplanHeader from "../../components/FloorplanHeader";
import { makePieChartSeries } from "../../components/index/MarkerElement";
import { useFloorplan } from "../../context/FloorplanContext";
import { styles as indexStyles } from "../../css/indexStyle";
import { styles as photoListStyles } from "../../css/photo_list";
import { Marker } from "../../hooks/useMarkers";
import { PhotoData } from "../../models/PhotoFormModel";
import { hashNameToColor } from "../../utils/stringColor";

enum SortBy {
  Group = "Sort by Group",
  Marker = "Sort by Marker",
}

type IndexedPhotoData = {
  index: number;
} & PhotoData;

interface SectionDataArgument {
  section: {
    key: string;
    data: IndexedPhotoData[];
  };
}

interface ImageListItemProps {
  item: IndexedPhotoData;
  expand: boolean;
}

export default function ImagesScreen() {
  const { markers, setSelectedMarkerId } = useFloorplan();
  const [sortBy, setSortBy] = useState(SortBy.Group);
  const [selected, setSelected] = useState(-1);
  console.log(`${selected < 0 ? "Nothing" : selected} is selected`);

  useFocusEffect(
    useCallback(() => {
      return setSelected(-1);
    }, [])
  );

  // Return and increment an index to help assign IDs that are unique across sections
  let nextIndex = 0;
  const newIndex = () => {
    const index = nextIndex;
    nextIndex += 1;
    return index;
  };

  // Sections are what will be used to generate the list, including the section header components
  const makeMarkerSections = (markers: Marker[]) => {
    return markers.map((marker) => ({
      key: marker.id,
      data: marker.photos.map((pd) => ({ ...pd, index: newIndex() })),
    }));
  };

  const makeGroupSections = (markers: Marker[]) => {
    const groups = new Map<string, PhotoData[]>();
    const sections: { key: string; data: IndexedPhotoData[] }[] = [];
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
        data: photos.map((pd) => ({ ...pd, index: newIndex() })),
      });
    });
    return sections;
  };

  const SortingButton = (sorting: SortBy) => {
    return (
      <TouchableOpacity
        style={photoListStyles.card}
        onPress={() => setSortBy(sorting)}
      >
        <Text style={[indexStyles.headerButton, { textAlign: "center" }]}>
          {sorting}
        </Text>
      </TouchableOpacity>
    );
  };

  // Header for the entire list. Contains buttons to change the sorting mode.
  const SortingSelector = () => {
    return (
      <View style={[photoListStyles.card, { justifyContent: "center" }]}>
        {SortingButton(SortBy.Group)}
        {SortingButton(SortBy.Marker)}
      </View>
    );
  };

  const MarkerHeader = ({ section: { key, data } }: SectionDataArgument) => {
    return (
      <TouchableOpacity
        style={[
          photoListStyles.card,
          { marginTop: "5%", alignItems: "center" },
        ]}
        onPress={() => {
          setSelectedMarkerId(key);
          router.navigate("/");
        }}
      >
        <PieChart
          widthAndHeight={25}
          series={makePieChartSeries(data)}
          cover={{ radius: 0.4 }}
          padAngle={0.1}
        />
        <Text style={indexStyles.headerButton}>Go to marker</Text>
      </TouchableOpacity>
    );
  };

  const GroupHeader = ({ section: { key } }: SectionDataArgument) => {
    return (
      <View
        style={[
          photoListStyles.card,
          { marginTop: "5%", alignItems: "center" },
        ]}
      >
        <PieChart
          widthAndHeight={25}
          series={[{ value: 1, color: hashNameToColor(key) }]}
        />
        <Text style={indexStyles.headerButton}>{key}</Text>
      </View>
    );
  };

  const SectionItem = ({ item, expand }: ImageListItemProps) => {
    const IMAGE_WIDTH = 50;
    const IMAGE_HEIGHT = 75;
    const EXPAND_SCALE = 4;
    const { index, pictureName, dateTaken, photoUri, areaGroup, description } =
      item;

    return (
      <View style={[photoListStyles.card, { zIndex: expand ? 100 : 0 }]}>
        <View style={photoListStyles.textContainer}>
          <Text
            style={photoListStyles.subtitle}
          >{`${areaGroup}\n${dateTaken}`}</Text>
          <TouchableOpacity onPress={() => setSelected(index)}>
            <Text style={photoListStyles.title}>{pictureName}</Text>
          </TouchableOpacity>
          {expand && description ? (
            <Text style={photoListStyles.subtitle}>{description}</Text>
          ) : null}
        </View>
        {expand ? (
          <SnapbackZoom>
            <Image
              source={{ uri: photoUri }}
              style={{
                width: IMAGE_WIDTH * EXPAND_SCALE,
                height: IMAGE_WIDTH * EXPAND_SCALE,
              }}
              resizeMethod="scale"
              resizeMode="contain"
            />
          </SnapbackZoom>
        ) : (
          <Image
            source={{ uri: photoUri }}
            style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
            resizeMethod="scale"
            resizeMode="contain"
          />
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView>
      <View style={indexStyles.container}>
        <FloorplanHeader showHelpButton />
        <SectionList
          sections={
            sortBy === SortBy.Group
              ? makeGroupSections(markers)
              : makeMarkerSections(markers)
          }
          renderItem={({ item }) => (
            <SectionItem item={item} expand={selected === item.index} />
          )}
          renderSectionHeader={
            sortBy === SortBy.Group ? GroupHeader : MarkerHeader
          }
          ListHeaderComponent={SortingSelector}
          stickySectionHeadersEnabled
        />
      </View>
    </GestureHandlerRootView>
  );
}
