import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import {
  CommonZoomState,
  TapGestureEvent,
  useTransformationState,
} from "react-native-zoom-toolkit";

import { useLogger } from "./LoggerContext";
import { Marker, MarkerContent, useMarkers } from "../hooks/useMarkers";
import { PhotoData } from "../models/PhotoFormModel";
import {
  createFloorplanImage,
  createFloorplanMarker,
  deleteFloorplanImageRecord,
  deleteFloorplanMarker,
  getFloorplanImageRecord,
  getFloorplanMarkers,
  replaceFloorplanMarker,
  resetUserData,
  updateFloorplanMarkerCoordinates,
} from "../utils/api";
import {
  normalizeFloorplanImage,
  normalizeMarkers,
  prepareMarkersForServer,
  toImageDataUri,
} from "../utils/imageDataHelpers";
import { FloorplanImage } from "../utils/types";

interface FloorplanContextReturn {
  floorplanId: string | null;
  floorplan: string | null;
  setFloorplan: Dispatch<SetStateAction<string | null>>;
  storedFloorplans: FloorplanImage[];
  isLoadingStoredFloorplans: boolean;
  isSavingMarkers: boolean;
  pickFloorplan: () => Promise<void>;
  pickFromMyFloorplan: (storedFloorplan: FloorplanImage) => Promise<void>;
  refreshStoredFloorplans: () => Promise<void>;
  clearAllUserData: () => Promise<void>;
  deleteStoredFloorplan: (storedFloorplan: FloorplanImage) => Promise<void>;
  handleCanvasPress: (event: TapGestureEvent) => void;
  markers: Marker[];
  replaceMarkers: (nextMarkers: Marker[]) => void;
  addMarker: (x: number, y: number, photos: PhotoData[]) => void;
  clearMarkers: () => void;
  editMarker: (id: string, editorFnc: (old: Marker) => Marker) => void;
  addPhotos: (id: string, photos: PhotoData[]) => void;
  removePhoto: (id: string, photo: PhotoData) => void;
  tryGetMarker: (x: number, y: number) => Marker | null;
  deleteMarker: (id: string) => void;
  selectedMarkerId: string | null;
  setSelectedMarkerId: Dispatch<SetStateAction<string | null>>;
  previewMarker: SharedPoint;
  showTempMarker: boolean;
  setShowTempMarker: Dispatch<SetStateAction<boolean>>;
  showMarkerOptions: boolean;
  setShowMarkerOptions: Dispatch<SetStateAction<boolean>>;
  selectedMarker: Marker | undefined;

  resumableState: CommonZoomState<SharedValue<number>>;
  onResumableUpdate: (state: CommonZoomState<number>) => void;

  withMarkerAt: withMarkerAtType;

  movePayload: MarkerContent | null;
  setMovePayload: Dispatch<SetStateAction<MarkerContent | null>>;
}

export type Point<T> = {
  x: T;
  y: T;
};

type SharedPoint = Point<SharedValue<number>>;

type MarkerFoundCallback = (marker: Marker, x: number, y: number) => void;
type MarkerNotFoundCallback = (x: number, y: number) => void;
type withMarkerAtType = (
  x: number,
  y: number,
  success: MarkerFoundCallback,
  failure: MarkerNotFoundCallback
) => void;

const FloorplanContext = createContext<FloorplanContextReturn | undefined>(
  undefined
);

export const FloorplanProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [floorplanId, setFloorplanId] = useState<string | null>(null);
  const [floorplan, setFloorplan] = useState<string | null>(null);
  const [storedFloorplans, setStoredFloorplans] = useState<FloorplanImage[]>(
    []
  );
  const [isLoadingStoredFloorplans, setIsLoadingStoredFloorplans] =
    useState(true);
  const [isSavingMarkers, setIsSavingMarkers] = useState(false);
  const marker = useMarkers();
  const { debug, error, log } = useLogger();

  const [showMarkerOptions, setShowMarkerOptions] = useState(false);

  const [showTempMarker, setShowTempMarker] = useState(false);

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const [movePayload, setMovePayload] = useState<MarkerContent | null>(null);

  useEffect(() => {
    refreshStoredFloorplans().catch((error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      debug(`Could not fetch stored floorplans: ${errorMessage}`);
    });
  }, []);

  /**
   * Replace the local marker state with marker data that came from the server.
   */
  function replaceMarkersFromSystem(nextMarkers: Marker[]): void {
    marker.replaceMarkers(nextMarkers);
  }

  /**
   * Clear the local marker state when the selected floorplan changes or resets.
   */
  function clearMarkersFromSystem(): void {
    marker.clearMarkers();
  }

  /**
   * Fetches the floorplan list from the server
   */
  async function refreshStoredFloorplans(): Promise<void> {
    setIsLoadingStoredFloorplans(true);

    try {
      const floorplanImageRecord = await getFloorplanImageRecord();
      log("Successfully fetched stored floorplans from API");
      setStoredFloorplans(
        floorplanImageRecord.floorplans.map((floorplan) =>
          normalizeFloorplanImage(floorplan)
        )
      );
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";

      if (errorMessage === "file not found") {
        log("Stored floorplans API returned no saved floorplans yet");
        setStoredFloorplans([]);
      } else {
        error(`Fetching stored floorplans failed: ${errorMessage}`);
      }
    } finally {
      setIsLoadingStoredFloorplans(false);
    }
  }

  /**
   * Loads one floorplan's markers from the server and uses the server state.
   */
  async function loadMarkersForStoredFloorplan(
    nextFloorplanId: string
  ): Promise<void> {
    try {
      const floorplanMarkers = await getFloorplanMarkers(nextFloorplanId);
      log(`Successfully fetched markers for floorplan ${nextFloorplanId}`);
      const serverMarkers = normalizeMarkers(floorplanMarkers);

      replaceMarkersFromSystem(serverMarkers);
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";

      if (errorMessage === "file not found") {
        log(`No saved markers found for floorplan ${nextFloorplanId}`);
        replaceMarkersFromSystem([]);
      } else {
        error(
          `Fetching markers for floorplan ${nextFloorplanId} failed: ${errorMessage}`
        );
        debug(`Could not fetch markers for floorplan: ${errorMessage}`);
      }
    }
  }

  /**
   * Prepare one marker for server storage by stripping duplicated image payloads. URI AND BASE WE ONLY NEED ONE
   */
  function markerForServer(currentMarker: Marker): Marker {
    return prepareMarkersForServer([currentMarker])[0];
  }

  /**
   * Create one new marker locally and on the server with a single POST request.
   */
  function addMarkerAtomically(
    x: number,
    y: number,
    photos: PhotoData[]
  ): void {
    if (!floorplanId) {
      error("No id for the selected floorplan");
      return;
    }

    const newMarker: Marker = {
      id: Date.now().toString(),
      photos,
      x,
      y,
    };

    setIsSavingMarkers(true);
    createFloorplanMarker(floorplanId, markerForServer(newMarker))
      .then(() => {
        marker.replaceMarkers(marker.markers.concat(newMarker));
        log(`Successfully created marker ${newMarker.id}`);
      })
      .catch((caughtError: unknown) => {
        const errorMessage =
          caughtError instanceof Error ? caughtError.message : "Unknown error";
        error(errorMessage);
      })
      .finally(() => {
        setIsSavingMarkers(false);
      });
  }

  /**
   * Update one marker through the most specific server call we can use.
   *
   * If only coordinates changed we use PATCH. If other fields changed we
   * replace the marker with delete+create because the server does not allow
   * general overwrite.
   */
  function editMarkerAtomically(
    id: string,
    editorFnc: (old: Marker) => Marker
  ): void {
    if (!floorplanId) {
      error("No id for the selected floorplan");
      return;
    }

    const existingMarker = marker.markers.find(
      (currentMarker) => currentMarker.id === id
    );
    if (!existingMarker) {
      error(`Marker ${id} not found`);
      return;
    }

    let nextMarker: Marker;

    try {
      nextMarker = editorFnc(existingMarker);
    } catch (caughtError) {
      throw caughtError;
    }

    const coordinatesChanged =
      existingMarker.x !== nextMarker.x || existingMarker.y !== nextMarker.y;
    const otherFieldsChanged =
      JSON.stringify({ ...existingMarker, x: undefined, y: undefined }) !==
      JSON.stringify({ ...nextMarker, x: undefined, y: undefined });

    let markerRequest: Promise<void> = Promise.resolve();

    if (coordinatesChanged && !otherFieldsChanged) {
      markerRequest = updateFloorplanMarkerCoordinates(
        floorplanId,
        markerForServer(nextMarker)
      );
    } else if (JSON.stringify(existingMarker) !== JSON.stringify(nextMarker)) {
      markerRequest = replaceFloorplanMarker(
        floorplanId,
        markerForServer(nextMarker)
      );
    }

    setIsSavingMarkers(true);
    markerRequest
      .then(() => {
        marker.editMarker(id, () => nextMarker);
        log(`Successfully updated marker ${id}`);
      })
      .catch((caughtError: unknown) => {
        const errorMessage =
          caughtError instanceof Error ? caughtError.message : "Unknown error";
        error(errorMessage);
      })
      .finally(() => {
        setIsSavingMarkers(false);
      });
  }

  /**
   * Add photos to one marker by replacing the full marker payload on the server.
   *
   * Photo changes are not coordinate-only updates, so they must use the
   * replace flow instead of PATCH.
   */
  function addPhotosAtomically(id: string, photos: PhotoData[]): void {
    if (!floorplanId) {
      error("No id for the selected floorplan");
      return;
    }

    const existingMarker = marker.markers.find(
      (currentMarker) => currentMarker.id === id
    );
    if (!existingMarker) {
      error(`Marker ${id} not found`);
      return;
    }

    const filteredPhotos = photos.filter(
      (photoToAdd) =>
        existingMarker.photos.findIndex(
          (existingPhoto) => existingPhoto.photoUri === photoToAdd.photoUri
        ) === -1
    );
    const nextMarker: Marker = {
      ...existingMarker,
      photos: existingMarker.photos.concat(filteredPhotos),
    };

    setIsSavingMarkers(true);
    replaceFloorplanMarker(floorplanId, markerForServer(nextMarker))
      .then(() => {
        marker.addPhotos(id, filteredPhotos);
        log(`Successfully added photos to marker ${id}`);
      })
      .catch((caughtError: unknown) => {
        const errorMessage =
          caughtError instanceof Error ? caughtError.message : "Unknown error";
        error(errorMessage);
      })
      .finally(() => {
        setIsSavingMarkers(false);
      });
  }

  /**
   * Remove one photo from one marker and keep the server in sync.
   *
   * If the last photo is removed, the whole marker is deleted. Otherwise the
   * marker is replaced with an updated photo list.
   */
  function removePhotoAtomically(id: string, photo: PhotoData): void {
    if (!floorplanId) {
      error("No id for the selected floorplan");
      return;
    }

    const existingMarker = marker.markers.find(
      (currentMarker) => currentMarker.id === id
    );
    if (!existingMarker) {
      error(`Marker ${id} not found`);
      return;
    }

    const photoIndex = existingMarker.photos.indexOf(photo);
    if (photoIndex === -1) {
      error(`Photo not found in marker ${id}`);
      return;
    }

    let markerRequest: Promise<void>;

    if (existingMarker.photos.length < 2) {
      markerRequest = deleteFloorplanMarker(floorplanId, id);
    } else {
      const nextMarker: Marker = {
        ...existingMarker,
        photos: existingMarker.photos.filter(
          (_, index) => index !== photoIndex
        ),
      };

      markerRequest = replaceFloorplanMarker(
        floorplanId,
        markerForServer(nextMarker)
      );
    }

    setIsSavingMarkers(true);
    markerRequest
      .then(() => {
        if (existingMarker.photos.length < 2) {
          marker.deleteMarker(id);
          log(`Successfully deleted marker ${id} after last photo removal`);
          return;
        }

        marker.removePhoto(id, photo);
        log(`Successfully removed photo from marker ${id}`);
      })
      .catch((caughtError: unknown) => {
        const errorMessage =
          caughtError instanceof Error ? caughtError.message : "Unknown error";
        error(errorMessage);
      })
      .finally(() => {
        setIsSavingMarkers(false);
      });
  }

  /**
   * Delete one marker locally and on the server with a single DELETE request.
   */
  function deleteMarkerAtomically(id: string): void {
    if (!floorplanId) {
      error("No id for the selected floorplan");
      return;
    }

    setIsSavingMarkers(true);
    deleteFloorplanMarker(floorplanId, id)
      .then(() => {
        marker.deleteMarker(id);
        log(`Successfully deleted marker ${id}`);
      })
      .catch((caughtError: unknown) => {
        const errorMessage =
          caughtError instanceof Error ? caughtError.message : "Unknown error";
        error(errorMessage);
      })
      .finally(() => {
        setIsSavingMarkers(false);
      });
  }

  const { onUpdate: onResumableUpdate, state: resumableState } =
    useTransformationState("resumable");

  const previewMarkerX = useSharedValue(0);
  const previewMarkerY = useSharedValue(0);

  // Utility function that performs one of two callbacks depending on if a marker can be found near (x,y)
  const withMarkerAt: withMarkerAtType = (x, y, success, failure) => {
    const existingMarker = marker.tryGetMarker(
      x,
      y,
      resumableState.scale.value // Selection area is scaled down when zoomed in to keep its relative size on screen
    );
    if (existingMarker) {
      success(existingMarker, x, y);
    } else {
      failure(x, y);
    }
  };

  const handleCanvasPress = (event: TapGestureEvent) => {
    // TODO: This function should be defined where it is used because withMarkerAt is a more general solution
    if (!floorplan) {
      debug("No Floorplan");
      return;
    }

    const { x, y } = event;
    withMarkerAt(
      x,
      y,
      (existingMarker, x, y) => {
        setSelectedMarkerId(existingMarker.id);
        setShowMarkerOptions(true);
        setShowTempMarker(false);
        debug(`Trying to select existing Marker near (${x},${y})`);
      },
      (x, y) => {
        // Create new marker position
        setSelectedMarkerId(null);
        previewMarkerX.value = x;
        previewMarkerY.value = y;
        setShowTempMarker(true);
        debug(`Trying to set temp Marker at (${x},${y})`);
      }
    );
  };

  const pickFloorplan = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      try {
        const selectedFloorplanImage = result.assets[0];
        const createdAt = new Date().toISOString();
        const nextFloorplanId = `floorplan-${Date.now()}`;
        const selectedFloorplanName =
          selectedFloorplanImage.fileName?.trim() ||
          `Gallery floorplan ${createdAt}`;
        const imageFileExtension =
          selectedFloorplanImage.fileName?.match(/\.([^.]+)$/)?.[1] ?? "jpg";
        const imageBase64 = await new File(selectedFloorplanImage.uri).base64();
        const imageUri = toImageDataUri(imageBase64, imageFileExtension);

        const nextStoredFloorplan: FloorplanImage = {
          id: nextFloorplanId,
          imageUri,
          imageName: selectedFloorplanName,
          createdAt,
          imageBase64,
          imageFileExtension,
        };
        await createFloorplanImage(nextStoredFloorplan);
        log(`Successfully saved gallery floorplan ${nextFloorplanId} to API`);

        await refreshStoredFloorplans();
        log("Successfully refreshed stored floorplans after gallery save");

        setFloorplanId(nextStoredFloorplan.id);
        setFloorplan(nextStoredFloorplan.imageUri);
        setSelectedMarkerId(null);
        setShowMarkerOptions(false);
        setShowTempMarker(false);
        clearMarkersFromSystem();
      } catch (caughtError) {
        const errorMessage =
          caughtError instanceof Error ? caughtError.message : "Unknown error";
        error(`Saving gallery floorplan failed: ${errorMessage}`);
        throw caughtError;
      }
    }
  };

  const pickFromMyFloorplan = async (storedFloorplan: FloorplanImage) => {
    setFloorplanId(storedFloorplan.id);
    setFloorplan(storedFloorplan.imageUri);
    setSelectedMarkerId(null);
    setShowMarkerOptions(false);
    setShowTempMarker(false);
    replaceMarkersFromSystem([]);

    await loadMarkersForStoredFloorplan(storedFloorplan.id);
  };

  const deleteStoredFloorplan = async (
    storedFloorplan: FloorplanImage
  ): Promise<void> => {
    try {
      await deleteFloorplanImageRecord(storedFloorplan.id);
      log(`Successfully deleted floorplan ${storedFloorplan.id} from API`);
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";
      error(`Deleting floorplan ${storedFloorplan.id} failed: ${errorMessage}`);
      throw caughtError;
    }

    setStoredFloorplans((currentFloorplans) =>
      currentFloorplans.filter(
        (currentFloorplan) => currentFloorplan.id !== storedFloorplan.id
      )
    );

    if (floorplanId === storedFloorplan.id) {
      setFloorplanId(null);
      setFloorplan(null);
      setSelectedMarkerId(null);
      setShowMarkerOptions(false);
      setShowTempMarker(false);
      clearMarkersFromSystem();
    }
  };

  const clearAllUserData = async (): Promise<void> => {
    await resetUserData();

    setFloorplanId(null);
    setFloorplan(null);
    setStoredFloorplans([]);
    setSelectedMarkerId(null);
    setShowMarkerOptions(false);
    setShowTempMarker(false);
    clearMarkersFromSystem();
  };

  return (
    <FloorplanContext.Provider
      value={{
        ...marker,
        floorplanId,
        floorplan,
        setFloorplan,
        storedFloorplans,
        isLoadingStoredFloorplans,
        isSavingMarkers,
        pickFloorplan,
        pickFromMyFloorplan,
        refreshStoredFloorplans,
        clearAllUserData,
        deleteStoredFloorplan,
        handleCanvasPress,
        addMarker: addMarkerAtomically,
        editMarker: editMarkerAtomically,
        addPhotos: addPhotosAtomically,
        removePhoto: removePhotoAtomically,
        deleteMarker: deleteMarkerAtomically,
        selectedMarker: selectedMarkerId
          ? marker.markers.find((m) => m.id === selectedMarkerId)
          : undefined,
        selectedMarkerId,
        setSelectedMarkerId,
        previewMarker: { x: previewMarkerX, y: previewMarkerY },
        showTempMarker,
        setShowTempMarker,
        showMarkerOptions,
        setShowMarkerOptions,
        resumableState,
        onResumableUpdate,
        withMarkerAt,
        movePayload,
        setMovePayload,
      }}
    >
      {children}
    </FloorplanContext.Provider>
  );
};

export const useFloorplan = () => {
  const context = useContext(FloorplanContext);
  if (context === undefined) {
    throw new Error("useFloorplan must be used within a FloorplanProvider");
  }
  return context;
};
