import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  CommonZoomState,
  ResumableZoom,
  ResumableZoomRefType,
} from "react-native-zoom-toolkit";

import FloatingHelpButton from "../../components/FloatingHelpButton";
import FloorplanHeader from "../../components/FloorplanHeader";
import LoadingOverlay from "../../components/LoadingOverlay";
import MyFloorPlans from "../../components/floorplans";
import { EditMarkerModal } from "../../components/index/EditMarkerModal";
import { MarkerElement } from "../../components/index/MarkerElement";
import { MarkerOptionsModal } from "../../components/index/MarkerOptionsModal";
import { NewMarkerOptionsModal } from "../../components/index/NewMarkerOptionsModal";
import { PhotoFormModal } from "../../components/photoForm";
import { useCamera, CameraMode } from "../../context/CameraContext";
import { useFloorplan } from "../../context/FloorplanContext";
import { useLogger } from "../../context/LoggerContext";
import { styles } from "../../css/indexStyle";
import { PhotoData } from "../../models/PhotoFormModel";
import { getVisibleRectFromState } from "../../utils/getVisibleRect";
import { preparePhotosForUpload } from "../../utils/imageDataHelpers";

export default function HomeScreen() {
  //---------------------------------- Starts when page is rendered-------------
  const {
    markers,
    storedFloorplans,
    isLoadingStoredFloorplans,
    floorplan,
    selectedMarkerId,
    pickFloorplan,
    pickFromMyFloorplan,
    deleteStoredFloorplan,
    handleCanvasPress,
    addPhotos,
    deleteMarker,
    addMarker,
    editMarker,
    previewMarker,
    showTempMarker,
    setSelectedMarkerId,
    setShowTempMarker,
    showMarkerOptions,
    setShowMarkerOptions,
    selectedMarker, //Reference, use with caution
    resumableState, // Persistent CommonZoomState updated by onResumableUpdate
    onResumableUpdate, // Pass to ResumableZoom's onUpdate-callback
    withMarkerAt,
    movePayload,
    setMovePayload,
  } = useFloorplan();

  const { capturedImage, captureMode } = useCamera();

  const { error, log } = useLogger();

  const [showNewMarkerOptions, setShowNewMarkerOptions] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<
    { uri: string; date: string }[]
  >([]);
  const [loadingText, setLoadingText] = useState<string | null>(null);

  const resumableRef = useRef<ResumableZoomRefType>(null);
  const describedPhotos = useRef<PhotoData[]>([]);
  const pendingPhotoMetadata = useRef<
    Record<string, { base64: string; fileExtension: string }>
  >({});
  const savedPhotos = useRef<PhotoData[]>([]);
  // The gallery edits photos for the single marker it was opened from. Re-read
  // that marker from the latest markers array so modal actions use fresh photos.

  useEffect(() => {
    savedPhotos.current = markers.flatMap((marker) => marker.photos);
  }, [markers]);

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
    const validImages: { image: ImagePicker.ImagePickerAsset; date: string }[] =
      [];

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
      validImages.push({ image, date: dateTaken });
    }
    return validImages;
  }
  /**
   * Starts the new-marker gallery flow by validating selected images.
   * We also prepare the picture for upload, making them base64 for sending.

   */
  const handleAddFromCameraRollToMarker = async () => {
    setShowNewMarkerOptions(false);
    const result = await pickPhotoFromLibrary(0);
    if (!result) return;

    try {
      const { preparedPhotoUris, photoMetadataByUri, dates } =
        await withLoadingOverlay("Running blur detection...", async () => {
          const validImages = await getValidImages(result);
          const validPhotoUris = validImages.map((p) => p.image.uri);
          const dates = validImages.map(({ date }) => date);
          log("Preparing photos for upload");
          const prepared = await preparePhotosForUpload(validPhotoUris);
          return { ...prepared, dates };
        });
      Object.assign(pendingPhotoMetadata.current, photoMetadataByUri);

      setPendingPhotos(
        preparedPhotoUris.map((uri, i) => ({ uri, date: dates[i] }))
      );
      log("Successfully prepared marker photos from gallery");
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";
      error(`Preparing marker gallery photos failed: ${errorMessage}`);
      throw caughtError;
    }
  };

  /**
   * Starts the add-to-marker camera flow, prepares the captured photo,
   * and queues it for the selected marker's photo form.
   */
  const handleAddPictureToMarker = async () => {
    router.navigate("/camera");
    captureMode.current = CameraMode.Addition;
    closeAllModals();
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
      router.navigate("/imagelist");
    }
    setShowMarkerOptions(false);
  };

  const handleMove = () => {
    captureMode.current = CameraMode.Placement;
    if (selectedMarker) setMovePayload(selectedMarker);
    closeAllModals();
    centerPreview();
    findImagePlacementTarget(previewMarker.x.value, previewMarker.y.value);
  };

  const closeAllModals = () => {
    setShowMarkerOptions(false);
    setShowTempMarker(false);
  };

  // Try to find a marker at the element center and select it, for when we're trying to place an image
  const findImagePlacementTarget = (x: number, y: number) =>
    withMarkerAt(
      x,
      y,
      ({ id }) => {
        // Found a marker: Select it for now
        setSelectedMarkerId(id);
      },
      () => {
        // Found no marker: Unselect if needed
        setSelectedMarkerId(null);
      }
    );

  const onResumablePlacementUpdate = (state: CommonZoomState<number>) => {
    "worklet";
    onResumableUpdate(state);
    const { x, y, width, height } = getVisibleRectFromState(state);
    previewMarker.x.value = x + width / 2;
    previewMarker.y.value = y + height / 2;
  };

  // Put the preview marker in the center of the ResumableZoom
  const centerPreview = () => {
    if (resumableRef.current) {
      const { x, y, width, height } = resumableRef.current.getVisibleRect();
      // Change the preview marker coordinates to the center of the (element in) ResumableZoom
      // Note that dividing by 2 with extendBorders = True returns element-space coordinates instead of container-space coordinates.
      previewMarker.x.value = x + width / 2;
      previewMarker.y.value = y + height / 2;
    }
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        // If you exit this tab while in Placement-mode, unset the mode.
        if (captureMode.current === CameraMode.Placement) {
          captureMode.current = CameraMode.None;
          setMovePayload(null);
        }
      };
    }, [])
  );

  // Runs whenever capturedImage updates e.g. when a new photo is taken using camera.tsx
  useEffect(() => {
    if (!capturedImage) return;
    if (captureMode.current === CameraMode.Placement) {
      // Image should be added to a user-selected marker or used to create a new marker at a user-defined position
      centerPreview();
      findImagePlacementTarget(previewMarker.x.value, previewMarker.y.value);
    } else if (captureMode.current === CameraMode.Addition) {
      // Image should be added to the currently selected marker or used to create a new marker at the preview
      const imageDate = new Date().toISOString().split("T")[0];
      withLoadingOverlay("Preparing photos for upload...", async () => {
        log("Preparing photos for upload");
        return preparePhotosForUpload([capturedImage]);
      })
        .then(({ preparedPhotoUris, photoMetadataByUri }) => {
          Object.assign(pendingPhotoMetadata.current, photoMetadataByUri);
          setPendingPhotos(
            preparedPhotoUris.map((uri) => ({ uri, date: imageDate }))
          );
          log(
            `Successfully prepared ${selectedMarkerId ? "additional" : "new"} marker photo from camera`
          );
        })
        .catch((caughtError: unknown) => {
          const errorMessage =
            caughtError instanceof Error
              ? caughtError.message
              : "Unknown error";
          error(
            `Preparing ${selectedMarkerId ? "additional" : "new"} marker camera photo failed: ${errorMessage}`
          );
          throw caughtError;
        });
      // Addition complete. Unset the mode but keep the URI
      captureMode.current = CameraMode.None;
    }
  }, [capturedImage]);

  // Show floor plan picker if no floor plan selected
  if (!floorplan) {
    return (
      <View style={styles.pickerContainer}>
        <StatusBar style="auto" />
        <FloatingHelpButton />
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
              if (describedPhotos.current.length > 0) {
                // If we've gotten submissions for something and nothing is pending, create or update a marker.
                if (selectedMarkerId) {
                  addPhotos(selectedMarkerId, describedPhotos.current);
                } else {
                  addMarker(
                    previewMarker.x.value,
                    previewMarker.y.value,
                    describedPhotos.current
                  );
                }
                describedPhotos.current = []; // Prep for next marker creation.
              }
            }} // Skip one URI on close.
            photoUri={pendingPhotos[0].uri}
            date={pendingPhotos[0].date}
            onSubmit={(photoData) => {
              console.log("DATE OF PHOTO: " + pendingPhotos[0].date);
              setPendingPhotos((photos) => photos.slice(0, -1));
              // Store data on submit of photo data.
              describedPhotos.current.push(photoData);
              savedPhotos.current.push(photoData);
              if (describedPhotos.current.length > 0) {
                // If we've gotten submissions for something and nothing is pending, create or update a marker.
                if (selectedMarkerId) {
                  addPhotos(selectedMarkerId, describedPhotos.current);
                } else {
                  addMarker(
                    previewMarker.x.value,
                    previewMarker.y.value,
                    describedPhotos.current
                  );
                }
                describedPhotos.current = []; // Prep for next marker creation.
              }
            }}
            visible={false}
          />
        )}

        {/* Header with change floor plan option and floating help button */}
        <FloorplanHeader showHelpButton />

        {/* Floor plan with markers. */}
        <ResumableZoom
          ref={resumableRef}
          extendGestures // This should be used with extendBorders or it might act weird.
          extendBorders // extendBorders is our own addition. Don't forget to apply the patch!
          onUpdate={
            captureMode.current === CameraMode.Placement
              ? onResumablePlacementUpdate
              : onResumableUpdate
          }
          onLongPress={(event) => {
            if (captureMode.current === CameraMode.Placement) {
              if (!movePayload) {
                // Confirm the image placement if one is ongoing
                console.info(`Confirming image placement via long press..`);
                const imageDate = new Date().toISOString().split("T")[0];
                setPendingPhotos([{ uri: capturedImage, date: imageDate }]);
              } else {
                // Confirm the move if one is ongoing
                const { id, photos } = movePayload;
                setMovePayload(null);
                if (selectedMarkerId) {
                  // Combine the moving marker with the selected one
                  if (selectedMarkerId !== id) {
                    addPhotos(selectedMarkerId, photos); // TODO: Filter based on more than just URI
                    deleteMarker(id);
                  }
                } else {
                  // Modify the coordinates of the moving marker
                  editMarker(id, (marker) => ({
                    ...marker,
                    x: previewMarker.x.value,
                    y: previewMarker.y.value,
                  }));
                }
              }
              captureMode.current = CameraMode.None;
            }
          }}
          onTap={(event) => {
            if (resumableRef.current) {
              const { scale, containerSize, childSize } =
                resumableRef.current.getState();
              // Adjust event coordinates to be in the child element's coordinate space
              event.x += -(containerSize.width / 2);
              event.y +=
                -(containerSize.height / 2) -
                (containerSize.height - childSize.height) / 2;
              if (
                !(
                  event.x >= 0 &&
                  event.x < childSize.width &&
                  event.y >= 0 &&
                  event.y < childSize.height
                )
              ) {
                // Abort if the tap was outside the child element
                return;
              }
              if (captureMode.current === CameraMode.Placement) {
                // Move to the position of the tap for quick navigation
                resumableRef.current.zoom(scale, { x: event.x, y: event.y });
                // Check if a marker was hit and select it
                findImagePlacementTarget(event.x, event.y);
              } else {
                // Bring up the menu to edit or create a marker
                handleCanvasPress(event);
              }
            }
          }}
          onGestureEnd={() => {
            if (captureMode.current === CameraMode.Placement) {
              findImagePlacementTarget(
                previewMarker.x.value,
                previewMarker.y.value
              );
            }
          }}
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
                marker={
                  movePayload?.id === marker.id
                    ? { ...marker, photos: [] }
                    : marker
                }
                key={marker.id}
                highlight={selectedMarkerId === marker.id}
                scale={resumableState.scale}
              />
            ))}

            {/* Preview of marker to camera-first create */}
            {captureMode.current === CameraMode.Placement || showTempMarker ? (
              <MarkerElement
                x={previewMarker.x}
                y={previewMarker.y}
                marker={movePayload ?? undefined}
                highlight={showTempMarker}
                scale={resumableState.scale}
              />
            ) : null}

            {/* New marker popup */}
            {showTempMarker && (
              <EditMarkerModal
                tempMarker={{
                  x: previewMarker.x,
                  y: previewMarker.y,
                }}
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
        </ResumableZoom>
        {/* New marker options modal */}
        <NewMarkerOptionsModal
          handleNewMarkerFromCameraRoll={handleAddFromCameraRollToMarker}
          showModal={showNewMarkerOptions}
          handleNewMarkerFromPicture={handleAddPictureToMarker}
          setShowNewMarkerOptions={setShowNewMarkerOptions}
          setShowTempMarker={setShowTempMarker}
        />

        <MarkerOptionsModal
          showModal={showMarkerOptions}
          marker={selectedMarker}
          handleShowPhotos={handleShowPhotos}
          closeAllModals={closeAllModals}
          handleAddFromPictureToMarker={handleAddPictureToMarker}
          handleAddFromCameraRollToMarker={handleAddFromCameraRollToMarker}
          handleMove={handleMove}
        />

        <Text style={styles.instructions}>
          {`${captureMode.current === CameraMode.Placement ? `Tap and hold to ${selectedMarkerId ? "add the image" : "create marker"}` : "Tap on the floor plan to place a marker"}`}
        </Text>
        {loadingText && (
          <LoadingOverlay text={loadingText ?? "Saving marker..."} />
        )}
      </View>
    </GestureHandlerRootView>
  );
}
