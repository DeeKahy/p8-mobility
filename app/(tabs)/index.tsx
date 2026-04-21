import { CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  ResumableZoom,
  useTransformationState,
} from "react-native-zoom-toolkit";

import { CameraUI } from "../../components/CameraUI";
import MyFloorPlans from "../../components/floorplans";
import { EditMarkerModal } from "../../components/index/EditMarkerModal";
import { MarkerElement } from "../../components/index/MarkerElement";
import { MarkerOptionsModal } from "../../components/index/MarkerOptionsModal";
import { NewMarkerOptionsModal } from "../../components/index/NewMarkerOptionsModal";
import { PhotoGalleryModal } from "../../components/index/PhotoGalleryModal";
import { PhotoFormModal } from "../../components/photoForm";
import { PhotoList } from "../../components/photos_list";
import { useFloorplan } from "../../context/FloorplanContext";
import { useLogger } from "../../context/LoggerContext";
import { styles } from "../../css/indexStyle";
import { PhotoData } from "../../models/PhotoFormModel";
import { isImageBlurry } from "../../utils/blurDetection";

export default function HomeScreen() {
  const {
    markers,
    floorplan,
    selectedMarkerId,
    pickFloorplan,
    pickFromMyFloorplan,
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

  const { onUpdate: onResumableUpdate, state: resumableState } =
    useTransformationState("resumable");

  const { log } = useLogger();

  const [showPhotos, setShowPhotos] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showNewMarkerOptions, setShowNewMarkerOptions] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [showPhotoListView, setShowPhotoListView] = useState<boolean>(false);

  const describedPhotos = useRef<PhotoData[]>([]);
  const cameraAction = useRef<((uri: string) => void) | undefined>(undefined);
  const cameraRef = useRef<CameraView>(null);
  const savedPhotos = useRef<PhotoData[]>([]);
  let currentUri = pendingPhotos[0];

  async function getValidImages(images: ImagePicker.ImagePickerAsset[]) {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const validImages: ImagePicker.ImagePickerAsset[] = [];

    for (const image of images) {
      const exifDate = image?.exif?.DateTimeOriginal;
      if (!exifDate || typeof exifDate !== "string") {
        log("No EXIF DateTimeOriginal found on selected image");

        Alert.alert(
          "Missing photo date",
          "This image does not contain metadata, so we cannot verify its age."
        );
        continue;
      }

      const dateTaken = exifDate.replace(/(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
      log("Formatted Data:" + dateTaken);

      if (new Date(dateTaken) < twoWeeksAgo) {
        Alert.alert("Picture is older than 14 days: " + dateTaken);
        continue;
      }

      const isBlurry = await isImageBlurry(image.uri, log);
      if (isBlurry) {
        Alert.alert("Image is too blurry. Please choose another.");
        continue;
      }
      validImages.push(image);
    }
    return validImages;
  }

  const handleNewMarkerFromCameraRoll = async () => {
    console.info("handleNewMarkerFromCameraRoll");
    setShowNewMarkerOptions(false);
    const result = await pickPhotoFromLibrary(0);
    if (!result || !tempMarker) return;

    setShowNewMarkerOptions(false);
    setShowTempMarker(false);
    setShowPhotoForm(true);
    setPendingPhotos((await getValidImages(result)).map((p) => p.uri));
  };

  const handleNewMarkerFromPicture = async () => {
    setShowNewMarkerOptions(false);
    setShowCamera(true);
    if (!tempMarker) return;

    cameraAction.current = (img) => {
      setPendingPhotos([img]);
      setShowCamera(false);
    };
    setShowNewMarkerOptions(false);
    setShowTempMarker(false);
  };

  const handleAddFromCameraRollToMarker = async () => {
    setShowNewMarkerOptions(false);
    const result = await pickPhotoFromLibrary(0);
    if (!result || !selectedMarkerId) return;
    setShowPhotoForm(true);
    setPendingPhotos((await getValidImages(result)).map((p) => p.uri));
  };

  const handleAddFromPictureToMarker = async () => {
    if (!selectedMarkerId) return;
    setShowNewMarkerOptions(false);
    setShowCamera(true);

    cameraAction.current = (img) => {
      setPendingPhotos([img]);
      setShowCamera(false);
    };
  };

  const handleDeletePhoto = (photo: PhotoData) => {
    if (!selectedMarkerId) return;
    removePhoto(selectedMarkerId, photo);
  };

  const pickPhotoFromLibrary = async (selectionLimit = 1) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      selectionLimit,
      allowsEditing: false,
      quality: 1,
      exif: true,
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
          <Text style={styles.pickButtonText}>Add from gallery</Text>
        </TouchableOpacity>
        <MyFloorPlans
          pickFloorPlan={pickFromMyFloorplan}
          photoUri=""
          onDelete={function (uri: string): void {
            throw new Error("Function not implemented.");
          }}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <StatusBar style="auto" />

        {currentUri && (
          <PhotoFormModal
            visible={showPhotoForm}
            onSkip={() => {
              pendingPhotos.pop();
              setPendingPhotos(pendingPhotos);
              if (tempMarker && describedPhotos.current.length > 0) {
                // If we've gotten submissions for something and nothing is pending, create or update a marker.
                if (selectedMarkerId) {
                  addPhotos(selectedMarkerId, describedPhotos.current);
                } else {
                  addMarker(
                    tempMarker.x,
                    tempMarker.y,
                    describedPhotos.current
                  );
                }
                describedPhotos.current = []; // Prep for next marker creation.
              }
              currentUri = pendingPhotos[0];
              setShowPhotoForm(false);
            }} // Skip one URI on close.
            photoUri={currentUri}
            date="2026-01-01"
            onSubmit={(photoData) => {
              pendingPhotos.pop();
              // Store data on submit of photo data.
              describedPhotos.current.push(photoData);
              savedPhotos.current.push(photoData);
              console.info(savedPhotos);
              setPendingPhotos(pendingPhotos);
              if (tempMarker && describedPhotos.current.length > 0) {
                // If we've gotten submissions for something and nothing is pending, create or update a marker.
                if (selectedMarkerId) {
                  addPhotos(selectedMarkerId, describedPhotos.current);
                } else {
                  addMarker(
                    tempMarker.x,
                    tempMarker.y,
                    describedPhotos.current
                  );
                }
                describedPhotos.current = []; // Prep for next marker creation.
              }
              currentUri = pendingPhotos[0];
            }}
          />
        )}

        {/* Header with change floor plan option */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Floor Plan</Text>
          <TouchableOpacity onPress={pickFloorplan}>
            <Text style={styles.headerButton}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Floor plan with markers. */}
        <ResumableZoom
          extendGestures // This should be used with extendBorders or it might act weird.
          extendBorders // extendBorders is our own addition. Don't forget to apply the patch!
          onUpdate={onResumableUpdate}
        >
          <GestureDetector
            gesture={Gesture.Tap() // Copying ResumableZoom's tap gesture parameters to have taps registered on the inside of it.
              .maxDuration(250)
              .numberOfTaps(1)
              .runOnJS(true)
              .onEnd(handleCanvasPress)}
          >
            <View style={styles.canvas}>
              <Image
                source={{ uri: floorplan }}
                style={styles.floorPlanImage}
                resizeMode="contain"
              />

              {/* Render markers */}
              {markers.map((marker) => (
                <MarkerElement
                  marker={marker}
                  key={marker.id}
                  scale={resumableState.scale}
                />
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
                  scale={resumableState.scale}
                />
              )}
            </View>
          </GestureDetector>
        </ResumableZoom>
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

        {showPhotoListView && (
          <View style={styles.fullscreenOverlay}>
            <PhotoList photoList={savedPhotos.current} />
          </View>
        )}
        <View>
          <TouchableOpacity
            style={styles.showListButton}
            onPress={() => setShowPhotoListView(!showPhotoListView)}
          >
            <Text>{showPhotoListView ? "Hide photos" : "Show photos"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.instructions}>
          Tap on the floor plan to place a marker
        </Text>
      </View>
    </GestureHandlerRootView>
  );
}
