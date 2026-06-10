import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
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

// Item type for the list
type IndexedPhotoData = {
  index: number; // Unique index in the list
  markerId: string; // ID of the marker this picture is associated with
  data: PhotoData; // Original PhotoData object
};

// Section type for the list
type ImageListSection = { key: string; data: IndexedPhotoData[] };

interface SectionHeaderProps {
  section: {
    key: string;
    data: IndexedPhotoData[];
  };
}

interface ImageListItemProps {
  item: IndexedPhotoData;
  expand: boolean;
}

interface ListButtonProps {
  text: string;
  action: () => void;
  enable?: boolean;
}

export default function ImagesScreen() {
  const { markers, selectedMarkerId, setSelectedMarkerId, removePhoto } =
    useFloorplan();
  const [sortBy, setSortBy] = useState(SortBy.Group);
  const [selected, setSelected] = useState(-1);
  const [fullscreenImage, setFullscreenImage] = useState("");
  const listRef = useRef<SectionList<IndexedPhotoData, ImageListSection>>(null);

  useFocusEffect(
    useCallback(() => {
      // Clean up the list selection
      return () => {
        setFullscreenImage("");
        setSelected(-1);
      };
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
    const sections: ImageListSection[] = [];
    markers.forEach((marker) => {
      if (!selectedMarkerId || selectedMarkerId === marker.id)
        sections.push({
          key: marker.id,
          data: marker.photos.map((pd) => ({
            index: newIndex(),
            markerId: marker.id,
            data: pd,
          })),
        });
    });
    return sections;
  };

  const makeGroupSections = (markers: Marker[]) => {
    const groups = new Map<string, IndexedPhotoData[]>();
    const sections: ImageListSection[] = [];
    // Split photos up according to their group
    markers.forEach((marker) => {
      if (!selectedMarkerId || selectedMarkerId === marker.id)
        marker.photos.forEach((pd: PhotoData) => {
          const ps = groups.get(pd.areaGroup) ?? [];
          ps.push({
            index: newIndex(),
            markerId: marker.id,
            data: pd,
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

  const sections =
    sortBy === SortBy.Group
      ? makeGroupSections(markers)
      : makeMarkerSections(markers);

  const ListButton = React.memo(
    ({ text, action, enable = true }: ListButtonProps) => {
      return (
        <TouchableOpacity
          style={[photoListStyles.card, { width: "40%" }]}
          onPress={action}
          disabled={!enable}
        >
          <Text
            style={[
              indexStyles.headerButton,
              { textAlign: "center", flex: 1 },
              enable ? null : { color: "#0000005b" },
            ]}
          >
            {text}
          </Text>
        </TouchableOpacity>
      );
    }
  );

  // Header for the entire list. Contains buttons to change the sorting mode.
  const SortingSelector = React.memo(() => {
    return (
      <View style={[photoListStyles.card, { justifyContent: "center" }]}>
        {sections.length > 0 ? (
          <>
            <ListButton
              text={SortBy.Group}
              action={() => setSortBy(SortBy.Group)}
              enable={sortBy !== SortBy.Group}
            />
            <ListButton
              text={SortBy.Marker}
              action={() => setSortBy(SortBy.Marker)}
              enable={sortBy !== SortBy.Marker}
            />
          </>
        ) : (
          <ListButton
            text="No images yet"
            action={() => router.navigate("/")}
          />
        )}
      </View>
    );
  });

  //Footer for the list. Contains a button to jump to the top and to clear selectedMarkerId
  const ListResetter = React.memo(() => {
    return (
      <View style={[photoListStyles.card, { justifyContent: "center" }]}>
        <ListButton
          text="To the top"
          action={() =>
            listRef?.current?.scrollToLocation({
              sectionIndex: 0,
              itemIndex: 0,
              animated: true,
            })
          }
        />
        <ListButton
          text="Show all"
          action={() => setSelectedMarkerId(null)}
          enable={!!selectedMarkerId}
        />
      </View>
    );
  });

  const MarkerHeader = React.memo(
    ({ section: { key, data: items } }: SectionHeaderProps) => {
      const imageCount = items.length;
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
            series={makePieChartSeries(items.map((item) => item.data))}
            cover={{ radius: 0.4 }}
            padAngle={0.1}
          />
          <Text
            style={indexStyles.headerButton}
          >{`Marker with ${imageCount} ${imageCount > 1 ? "images" : "image"}`}</Text>
        </TouchableOpacity>
      );
    }
  );

  const GroupHeader = React.memo(
    ({ section: { key, data: items } }: SectionHeaderProps) => {
      const imageCount = items.length;
      return (
        <View style={[photoListStyles.card, { alignItems: "center" }]}>
          <PieChart
            widthAndHeight={25}
            series={[{ value: 1, color: hashNameToColor(key) }]}
          />
          <Text
            style={indexStyles.headerButton}
          >{`${key} with ${imageCount} ${imageCount > 1 ? "images" : "image"}`}</Text>
        </View>
      );
    }
  );

  const SectionItem = React.memo(({ item, expand }: ImageListItemProps) => {
    const IMAGE_WIDTH = 50;
    const IMAGE_HEIGHT = 75;
    const EXPAND_SCALE = 4;
    const {
      index,
      markerId,
      data: { pictureName, dateTaken, photoUri, areaGroup, description },
    } = item;

    return (
      <View style={[photoListStyles.card, { flexDirection: "column" }]}>
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
              onPress={() => {
                removePhoto(markerId, item.data);
                setSelected(-1);
              }}
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
  });

  const renderItem = ({ item }: { item: IndexedPhotoData }) => (
    <SectionItem item={item} expand={selected === item.index} />
  );

  const renderSectionHeader =
    sortBy === SortBy.Group
      ? ({ section }: SectionHeaderProps) => <GroupHeader section={section} />
      : ({ section }: SectionHeaderProps) => <MarkerHeader section={section} />;

  const renderSectionFooter = () => <View style={{ height: 7.5 }} />;

  return (
    <GestureHandlerRootView>
      <View style={indexStyles.container}>
        <FloorplanHeader showHelpButton />
        <SectionList
          ref={listRef}
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          ListHeaderComponent={SortingSelector}
          ListFooterComponent={sections.length > 0 ? ListResetter : undefined}
          stickySectionHeadersEnabled
          removeClippedSubviews
        />
        {fullscreenImage ? (
          <FullscreenImage uri={fullscreenImage} setUri={setFullscreenImage} />
        ) : null}
      </View>
    </GestureHandlerRootView>
  );
}
