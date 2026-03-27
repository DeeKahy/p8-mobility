import { CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";

import { CameraUI } from "../../components/CameraUI";
import { EditMarkerModal } from "../../components/index/EditMarkerModal";
import { MarkerElement } from "../../components/index/MarkerElement";
import { MarkerOptionsModal } from "../../components/index/MarkerOptionsModal";
import { NewMarkerOptionsModal } from "../../components/index/NewMarkerOptionsModal";
import { PhotoGalleryModal } from "../../components/index/PhotoGalleryModal";
import { useFloorplan } from "../../context/FloorplanContext";
import { styles } from "../../css/indexStyle";

export default function HomeScreen() {
  const {
    markers,
    floorplan,
    selectedMarkerId,
    pickFloorplan,
    handleCanvasPress,
    addPhotos,
    removePhoto,
    addMarker,
    tempMarker,
    showTempMarker,
    setSelectedMarkerId,
    setShowTempMarker,
    showMarkerOptions,
    setShowMarkerOptions,
    selectedMarker, //Reference, use with caution
  } = useFloorplan();

  const [showPhotos, setShowPhotos] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showNewMarkerOptions, setShowNewMarkerOptions] = useState(false);

  const cameraAction = useRef<((uri: string) => void) | undefined>(undefined);
  const cameraRef = useRef<CameraView>(null);

  const handleNewMarkerFromCameraRoll = async () => {
    setShowNewMarkerOptions(false);
    const result = await pickPhotoFromLibrary(0);
    if (!result || !tempMarker) return;

    addMarker(
      tempMarker.x,
      tempMarker.y,
      result.map((p) => p.uri)
    );
    setShowNewMarkerOptions(false);
    setShowTempMarker(false);
  };

  const handleNewMarkerFromPicture = async () => {
    setShowNewMarkerOptions(false);
    setShowCamera(true);
    if (!tempMarker) return;

    cameraAction.current = (img) => {
      addMarker(tempMarker.x, tempMarker.y, [img]);
      setShowCamera(false);
    };
    setShowNewMarkerOptions(false);
    setShowTempMarker(false);
  };

  const handleAddFromCameraRollToMarker = async () => {
    setShowNewMarkerOptions(false);
    const result = await pickPhotoFromLibrary(0);
    if (!result || !selectedMarkerId) return;

    addPhotos(
      selectedMarkerId,
      result.map((p) => p.uri)
    );
  };

  const handleAddFromPictureToMarker = async () => {
    if (!selectedMarkerId) return;
    setShowNewMarkerOptions(false);
    setShowCamera(true);

    cameraAction.current = (img) => {
      addPhotos(selectedMarkerId, [img]);
      setShowCamera(false);
    };
  };

  const handleDeletePhoto = (photoURI: string) => {
    if (!selectedMarkerId) return;
    removePhoto(selectedMarkerId, photoURI);
  };

  const pickPhotoFromLibrary = async (selectionLimit = 1) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      selectionLimit,
      allowsEditing: false,
      quality: 1,
    });
    if (res.canceled) return null;
    return res.assets;
  };

  const handleShowPhotos = () => {
    setShowMarkerOptions(false);
    setShowPhotos(true);
  };

  const closeAllModals = () => {
    setShowCamera(false);
    setShowPhotos(false);
    setSelectedMarkerId(null);
    setShowMarkerOptions(false);
    setShowTempMarker(false);
  };

  if (showCamera) {
    return (
      <CameraUI
        onPictureTaken={cameraAction.current}
        cameraRef={cameraRef}
        onCancel={() => setShowCamera(false)}
      />
    );
  }

  // Show floor plan picker if no floor plan selected
  if (!floorplan) {
    return (
      <View style={styles.pickerContainer}>
        <StatusBar style="auto" />
        <Text style={styles.title}>Floor Plan Marker</Text>
        <Text style={styles.subtitle}>
          Select a floor plan image to get started
        </Text>
        <TouchableOpacity style={styles.pickButton} onPress={pickFloorplan}>
          <Text style={styles.pickButtonText}>Select Floor Plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* Header with change floor plan option */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Floor Plan</Text>
        <TouchableOpacity onPress={pickFloorplan}>
          <Text style={styles.headerButton}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Floor plan with markers. THIS IS WHERE PINCH-TO-ZOOM FUNCTIONALITY SHOULD GO */}
      <Pressable style={styles.canvas} onPress={handleCanvasPress}>
        <Image
          source={{ uri: floorplan }}
          style={styles.floorPlanImage}
          resizeMode="contain"
        />

        {/* Render markers */}
        {markers.map((marker) => (
          <MarkerElement marker={marker} key={marker.id} />
        ))}

        {/* New marker popup */}
        {showTempMarker && tempMarker && (
          <EditMarkerModal
            tempMarker={tempMarker}
            onCancel={() => {
              setShowTempMarker(false);
            }}
            onAddPicture={() => {
              setShowNewMarkerOptions(true);
            }}
          />
        )}
      </Pressable>

      {/* New marker options modal */}
      <NewMarkerOptionsModal
        handleNewMarkerFromCameraRoll={handleNewMarkerFromCameraRoll}
        showModal={showNewMarkerOptions}
        handleNewMarkerFromPicture={handleNewMarkerFromPicture}
        setShowNewMarkerOptions={setShowNewMarkerOptions}
        setShowTempMarker={setShowTempMarker}
      />

      <MarkerOptionsModal
        showModal={showMarkerOptions}
        marker={selectedMarker}
        handleShowPhotos={handleShowPhotos}
        closeAllModals={closeAllModals}
        handleAddFromPictureToMarker={handleAddFromPictureToMarker}
        handleAddFromCameraRollToMarker={handleAddFromCameraRollToMarker}
      />

      <PhotoGalleryModal
        showModal={showPhotos}
        marker={selectedMarker}
        handleDeletePhoto={handleDeletePhoto}
        closeAllModals={closeAllModals}
      />

      <Text style={styles.instructions}>
        Tap on the floor plan to place a marker
      </Text>
    </View>
  );
}
