import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { TouchableOpacity, View, Text, SectionList, Image } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import PieChart from "react-native-pie-chart";

import FloorplanHeader from "../../components/FloorplanHeader";
import FullscreenImage from "../../components/FullscreenImage";
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
  index: number; // Unique index in the list
  markerId: string; // ID of the marker this picture is associated with
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
  const { markers, setSelectedMarkerId, removePhoto } = useFloorplan();
  const [sortBy, setSortBy] = useState(SortBy.Group);
  const [selected, setSelected] = useState(-1);
  const [fullscreenImage, setFullscreenImage] = useState("");

  useFocusEffect(
    useCallback(() => {
      setSelectedMarkerId(null);
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

  const navigateToMarker = (id: string) => {
    setSelectedMarkerId(id);
    router.navigate("/");
  };

  // Sections are what will be used to generate the list, including the section header components
  const makeMarkerSections = (markers: Marker[]) => {
    return markers.map((marker) => ({
      key: marker.id,
      data: marker.photos.map((pd) => ({
        ...pd,
        index: newIndex(),
        markerId: marker.id,
      })),
    }));
  };

  const makeGroupSections = (markers: Marker[]) => {
    const groups = new Map<string, IndexedPhotoData[]>();
    const sections: { key: string; data: IndexedPhotoData[] }[] = [];
    // Split photos up according to their group
    markers.forEach((marker) => {
      marker.photos.forEach((pd: PhotoData) => {
        const ps = groups.get(pd.areaGroup) ?? [];
        ps.push({
          ...pd,
          index: newIndex(),
          markerId: marker.id,
        });
        groups.set(pd.areaGroup, ps);
      });
    });
    // Make sections with groupName as keys
    groups.forEach((indexedPhotos, groupName) => {
      sections.push({
        key: groupName,
        data: indexedPhotos,
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
    const imageCount = data.length;
    return (
      <TouchableOpacity
        style={[
          photoListStyles.card,
          { marginTop: "5%", alignItems: "center" },
        ]}
        onPress={() => navigateToMarker(key)}
      >
        <PieChart
          widthAndHeight={25}
          series={makePieChartSeries(data)}
          cover={{ radius: 0.4 }}
          padAngle={0.1}
        />
        <Text
          style={indexStyles.headerButton}
        >{`Marker with ${imageCount} ${imageCount > 1 ? "images" : "image"}`}</Text>
      </TouchableOpacity>
    );
  };

  const GroupHeader = ({ section: { key, data } }: SectionDataArgument) => {
    const imageCount = data.length;
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
        <Text
          style={indexStyles.headerButton}
        >{`${key} with ${imageCount} ${imageCount > 1 ? "images" : "image"}`}</Text>
      </View>
    );
  };

  const SectionItem = ({ item, expand }: ImageListItemProps) => {
    const IMAGE_WIDTH = 50;
    const IMAGE_HEIGHT = 75;
    const EXPAND_SCALE = 4;
    const {
      index,
      markerId,
      pictureName,
      dateTaken,
      photoUri,
      areaGroup,
      description,
    } = item;

    return (
      <View
        style={[
          photoListStyles.card,
          { flexDirection: "column", zIndex: expand ? 100 : 0 },
        ]}
      >
        <View style={{ flexDirection: "row" }}>
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
          <View
            style={[photoListStyles.textContainer, { alignItems: "flex-end" }]}
          >
            <TouchableOpacity
              onPress={() => {
                setSelected(index);
                setFullscreenImage(photoUri);
              }}
            >
              <Image
                source={{ uri: photoUri }}
                style={{
                  width: expand ? IMAGE_WIDTH * EXPAND_SCALE : IMAGE_WIDTH,
                  height: expand ? IMAGE_HEIGHT * EXPAND_SCALE : IMAGE_HEIGHT,
                }}
                resizeMethod="scale"
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
        {expand ? (
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={{ flex: 1, alignSelf: "flex-start" }}
              onPress={() => removePhoto(markerId, item)}
            >
              <Text style={[indexStyles.headerButton, { color: "#f32121" }]}>
                Delete image
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, alignSelf: "flex-end" }}
              onPress={() => navigateToMarker(markerId)}
            >
              <Text style={[indexStyles.headerButton, { textAlign: "right" }]}>
                Go to marker
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
        {fullscreenImage ? (
          <FullscreenImage uri={fullscreenImage} setUri={setFullscreenImage} />
        ) : null}
      </View>
    </GestureHandlerRootView>
  );
}
