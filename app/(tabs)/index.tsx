import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import {
  ResumableZoom,
  useTransformationState,
} from "react-native-zoom-toolkit";

import { CameraUI } from "../../components/CameraUI";
import LoadingOverlay from "../../components/LoadingOverlay";
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
import { useToast } from "../../context/ToastProvider";
import { styles } from "../../css/indexStyle";
import type { Marker } from "../../hooks/useMarkers";
import { PhotoData } from "../../models/PhotoFormModel";
import { getBlurScore, IMAGE_BLUR_THRESHOLD } from "../../utils/blurDetection";
import { preparePhotosForUpload } from "../../utils/imageDataHelpers";
import { getVisibleRectFromState } from "../../utils/getVisibleRect";

export default function HomeScreen() {
  //---------------------------------- Starts when page is rendered-------------
  const {
    markers,
    storedFloorplans,
    isLoadingStoredFloorplans,
    isSavingMarkers,
    floorplan,
    selectedMarkerId,
    pickFloorplan,
    pickFromMyFloorplan,
    deleteStoredFloorplan,
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
    imageToPlace, // When this is truthy, block all marker interactions and listen for a confirmation instead
    setImageToPlace, // Use to set "" when imageToPlace has been moved to pendingPhotos via confirmation
  } = useFloorplan();

  const { onUpdate: onResumableUpdate, state: resumableState } =
    useTransformationState("resumable");
  const resumableElementCenterX = useSharedValue(1);
  const resumableElementCenterY = useSharedValue(1);

  const { error, log } = useLogger();
  const { showToast } = useToast();

  const [showPhotos, setShowPhotos] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showNewMarkerOptions, setShowNewMarkerOptions] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [showPhotoListView, setShowPhotoListView] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string | null>(null);
  // Keep the gallery tied to the marker it opened for while selection/modal state changes.
  const [photoGalleryMarkerId, setPhotoGalleryMarkerId] = useState<
    string | null
  >(null);

  const describedPhotos = useRef<PhotoData[]>([]);
  const cameraAction = useRef<((uri: string) => void) | undefined>(undefined);
  const pendingPhotoMetadata = useRef<
    Record<string, { base64: string; fileExtension: string }>
  >({});
  const savedPhotos = useRef<PhotoData[]>([]);
  // The gallery edits photos for the single marker it was opened from. Re-read
  // that marker from the latest markers array so modal actions use fresh photos.
  let photoGalleryMarker: Marker | undefined;
  if (photoGalleryMarkerId) {
    photoGalleryMarker = markers.find(
      (marker) => marker.id === photoGalleryMarkerId
    );
  } else {
    photoGalleryMarker = undefined;
  }

  useEffect(() => {
    savedPhotos.current = markers.flatMap((marker) => marker.photos);
  }, [markers]);

  async function scoreAndToastBlur(uri: string): Promise<number> {
    const score = await getBlurScore(uri);
    const isBlurry = score < IMAGE_BLUR_THRESHOLD;
    const roundedScore = Math.round(score);

    showToast(
      `Blur score: ${roundedScore} (${isBlurry ? "blurry" : "sharp"})`,
      isBlurry ? "Error" : "Info"
    );
    log(
      `Blur detection result | score: ${score} | threshold: ${IMAGE_BLUR_THRESHOLD} | blurry: ${isBlurry}`
    );

    return score;
  }

  async function withLoadingOverlay<T>(
    text: string,
    action: () => Promise<T>
  ): Promise<T> {
    setLoadingText(text);

    try {
      return await action();
    } finally {
      setLoadingText(null);
    }
  }

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

      await scoreAndToastBlur(image.uri);
      validImages.push(image);
    }
    return validImages;
  }
  /**
   * Starts the new-marker gallery flow by validating selected images.
   * We also prepare the picture for upload, making them base64 for sending.

   */
  const handleNewMarkerFromCameraRoll = async () => {
    setShowNewMarkerOptions(false);
    const result = await pickPhotoFromLibrary(0);
    if (!result || !tempMarker) return;

    try {
      const { preparedPhotoUris, photoMetadataByUri } =
        await withLoadingOverlay("Running blur detection...", async () => {
          // Validates thats its not older than x days
          const validImages = await getValidImages(result);
          const validPhotoUris = validImages.map((p) => p.uri);
          log("Preparing photos for upload");
          return preparePhotosForUpload(validPhotoUris);
        });
      Object.assign(pendingPhotoMetadata.current, photoMetadataByUri);

      setShowNewMarkerOptions(false);
      setShowTempMarker(false);
      setPendingPhotos(preparedPhotoUris);
      log("Successfully prepared new marker photos from gallery");
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";
      error(`Preparing new marker gallery photos failed: ${errorMessage}`);
    }
  };

  const handleNewMarkerFromPicture = async () => {
    setShowNewMarkerOptions(false);
    setShowCamera(true);
    if (!tempMarker) return;

    cameraAction.current = (img) => {
      withLoadingOverlay("Running blur detection...", async () => {
        await scoreAndToastBlur(img);
        log("Preparing photos for upload");
        return preparePhotosForUpload([img]);
      })
        .then(({ preparedPhotoUris, photoMetadataByUri }) => {
          Object.assign(pendingPhotoMetadata.current, photoMetadataByUri);
          setPendingPhotos(preparedPhotoUris);
          setShowCamera(false);
          log("Successfully prepared new marker photo from camera");
        })
        .catch((caughtError: unknown) => {
          const errorMessage =
            caughtError instanceof Error
              ? caughtError.message
              : "Unknown error";
          error(`Preparing new marker camera photo failed: ${errorMessage}`);
          throw caughtError;
        });
    };
    setShowNewMarkerOptions(false);
    setShowTempMarker(false);
  };

  const handleAddFromCameraRollToMarker = async () => {
    setShowNewMarkerOptions(false);
    const result = await pickPhotoFromLibrary(0);
    if (!result || !selectedMarkerId) return;

    try {
      const { preparedPhotoUris, photoMetadataByUri } =
        await withLoadingOverlay("Running blur detection...", async () => {
          const validPhotoUris = (await getValidImages(result)).map(
            (photo) => photo.uri
          );
          log("Preparing photos for upload");
          return preparePhotosForUpload(validPhotoUris);
        });
      Object.assign(pendingPhotoMetadata.current, photoMetadataByUri);

      setPendingPhotos(preparedPhotoUris);
      log("Successfully prepared additional marker photos from gallery");
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";
      error(
        `Preparing additional marker gallery photos failed: ${errorMessage}`
      );
      throw caughtError;
    }
  };
  /**
   * Starts the add-to-marker camera flow, prepares the captured photo,
   * and queues it for the selected marker's photo form.
   */
  const handleAddFromPictureToMarker = async () => {
    if (!selectedMarkerId) return;
    setShowNewMarkerOptions(false);
    setShowCamera(true);

    cameraAction.current = (img) => {
      withLoadingOverlay("Running blur detection...", async () => {
        await scoreAndToastBlur(img);
        log("Preparing photos for upload");
        return preparePhotosForUpload([img]);
      })
        .then(({ preparedPhotoUris, photoMetadataByUri }) => {
          Object.assign(pendingPhotoMetadata.current, photoMetadataByUri);
          setPendingPhotos(preparedPhotoUris);
          setShowCamera(false);
          log("Successfully prepared additional marker photo from camera");
        })
        .catch((caughtError: unknown) => {
          const errorMessage =
            caughtError instanceof Error
              ? caughtError.message
              : "Unknown error";
          error(
            `Preparing additional marker camera photo failed: ${errorMessage}`
          );
          throw caughtError;
        });
    };
  };

  const handleDeletePhoto = (photo: PhotoData) => {
    const markerIdToUpdate = photoGalleryMarkerId ?? selectedMarkerId;

    if (!markerIdToUpdate) return;
    removePhoto(markerIdToUpdate, photo);
  };
  /**
   * Opens the device image library and returns the selected image assets.
   */
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
    if (selectedMarkerId) {
      setPhotoGalleryMarkerId(selectedMarkerId);
    }
    setShowMarkerOptions(false);
    setShowPhotos(true);
  };

  const closeAllModals = () => {
    setShowCamera(false);
    setShowPhotos(false);
    setPhotoGalleryMarkerId(null);
    setSelectedMarkerId(null);
    setShowMarkerOptions(false);
    setShowTempMarker(false);
  };

  if (showCamera) {
    return (
      <View style={{ flex: 1 }}>
        <CameraUI
          onPictureTaken={cameraAction.current}
          onCancel={() => setShowCamera(false)}
        />
        {loadingText && <LoadingOverlay text={loadingText} />}
      </View>
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
          floorplans={storedFloorplans}
          isLoading={isLoadingStoredFloorplans}
          pickFloorPlan={pickFromMyFloorplan}
          onDeleteFloorPlan={deleteStoredFloorplan}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <StatusBar style="auto" />

        {pendingPhotos.length > 0 && (
          <PhotoFormModal
            onSkip={() => {
              setPendingPhotos((photos) => photos.slice(0, -1));
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
              //setShowPhotoForm(false);
            }} // Skip one URI on close.
            photoUri={pendingPhotos[0]}
            date="2026-01-01"
            onSubmit={(photoData) => {
              setPendingPhotos((photos) => photos.slice(0, -1));
              // Store data on submit of photo data.
              describedPhotos.current.push(photoData);
              savedPhotos.current.push(photoData);
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
            }}
            visible={false}
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
          onUpdate={(state) => {
            "worklet";
            onResumableUpdate(state);
            const rect = getVisibleRectFromState(resumableState);
            // Update coordinates for ResumableZoom viewport center.
            // Note that dividing by 2 with extendGestures = True returns element-space coordinates, which we want.
            resumableElementCenterX.value = rect.x + rect.width / 2;
            resumableElementCenterY.value = rect.y + rect.height / 2;
          }}
          onLongPress={(event) => {
            // Find the point currently at the center of the screen.
            const rect = getVisibleRectFromState(resumableState);
            resumableElementCenterX.value = rect.x + rect.width / 2;
            resumableElementCenterY.value = rect.y + rect.height / 2;
            console.info(
              resumableElementCenterX.value,
              resumableElementCenterY.value
            );
            setImageToPlace("");
          }}
        >
          <GestureDetector
            gesture={Gesture.Tap() // Copying ResumableZoom's tap gesture parameters to have taps registered on the inside of it.
              .maxDuration(250)
              .numberOfTaps(1)
              .runOnJS(true)
              .onEnd(imageToPlace ? () => { } : handleCanvasPress)} // Disable gesture (but still eat inputs!) if an image must be placed first
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

              {/* Preview of marker to camera-first create */}
              {imageToPlace !== "" ? (
                <MarkerElement
                  x={resumableElementCenterX}
                  y={resumableElementCenterY}
                  scale={resumableState.scale}
                />
              ) : null}

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
          marker={photoGalleryMarker}
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
        {(loadingText || isSavingMarkers) && (
          <LoadingOverlay text={loadingText ?? "Saving marker..."} />
        )}
      </View>
    </GestureHandlerRootView>
  );
}
