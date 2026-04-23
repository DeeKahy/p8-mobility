import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { TapGestureEvent } from "react-native-zoom-toolkit";

import { useLogger } from "./LoggerContext";
import { Marker, useMarkers } from "../hooks/useMarkers";
import { PhotoData } from "../models/PhotoFormModel";
import {
  deleteFloorplanImageRecord,
  deleteFloorplanMarkerCollectionsForFloorplan,
  getFloorplanImageRecord,
  getFloorplanMarkerCollectionRecord,
  resetUserData,
  saveFloorplanImageRecord,
  saveFloorplanMarkerCollectionRecord,
} from "../utils/api";
import {
  normalizeFloorplanImage,
  normalizeMarkers,
  prepareMarkersForServer,
  toImageDataUri,
} from "../utils/imageDataHelpers";
import {
  FloorplanImage,
  FloorplanImageRecord,
  FloorplanMarkerCollectionRecord,
} from "../utils/types";

interface FloorplanContextReturn {
  floorplanId: string | null;
  floorplan: string | null;
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
  tempMarker: TempMarker | null;
  setTempMarker: Dispatch<SetStateAction<TempMarker>>;
  showTempMarker: boolean;
  setShowTempMarker: Dispatch<SetStateAction<boolean>>;
  showMarkerOptions: boolean;
  setShowMarkerOptions: Dispatch<SetStateAction<boolean>>;
  selectedMarker: Marker | undefined;
}

interface TempMarker {
  x: number;
  y: number;
}

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
  const [storedMarkerCollections, setStoredMarkerCollections] = useState<
    FloorplanMarkerCollectionRecord["collections"]
  >([]);
  const [isLoadingStoredFloorplans, setIsLoadingStoredFloorplans] =
    useState(true);
  const [isSavingMarkers, setIsSavingMarkers] = useState(false);
  const marker = useMarkers();
  const { debug, error, log } = useLogger();
  const isApplyingSystemMarkerUpdate = useRef(false);

  const [showMarkerOptions, setShowMarkerOptions] = useState(false);

  const [tempMarker, setTempMarker] = useState<TempMarker>({ x: 0, y: 0 });
  const [showTempMarker, setShowTempMarker] = useState(false);

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  useEffect(() => {
    refreshStoredFloorplans().catch((error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      debug(`Could not fetch stored floorplans: ${errorMessage}`);
    });
  }, []);

  useEffect(() => {
    if (isApplyingSystemMarkerUpdate.current) {
      log("Marker sync step: skipping save for system-applied marker update");
      isApplyingSystemMarkerUpdate.current = false;
      return;
    }

    if (!floorplanId) {
      return;
    }

    log("Marker save step: detected marker change, starting save");
    persistMarkersForFloorplan(floorplanId, marker.markers).catch(
      (caughtError: unknown) => {
        const errorMessage =
          caughtError instanceof Error ? caughtError.message : "Unknown error";
        debug(`Could not persist markers for floorplan: ${errorMessage}`);
      }
    );
  }, [marker.markers]);

  function replaceMarkersFromSystem(nextMarkers: Marker[]): void {
    isApplyingSystemMarkerUpdate.current = true;
    marker.replaceMarkers(nextMarkers);
  }

  function clearMarkersFromSystem(): void {
    isApplyingSystemMarkerUpdate.current = true;
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
      // Vi henter alle markers fra alle pt. Kunne laves til global stadie, vis performence isue senere hen
      const floorplanMarkerCollectionRecord =
        await getFloorplanMarkerCollectionRecord();
      setStoredMarkerCollections(floorplanMarkerCollectionRecord.collections);
      log(`Successfully fetched markers for floorplan ${nextFloorplanId}`);
      const selectedCollection =
        floorplanMarkerCollectionRecord.collections.find(
          (collection) => collection.floorplanId === nextFloorplanId
        );

      let markers: Marker[];
      if (selectedCollection && selectedCollection.markers) {
        markers = selectedCollection.markers;
      } else {
        markers = [];
      }
      const serverMarkers = normalizeMarkers(markers);

      replaceMarkersFromSystem(serverMarkers);
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";

      if (errorMessage === "file not found") {
        log(`No saved markers found for floorplan ${nextFloorplanId}`);
        setStoredMarkerCollections([]);
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
  Function to save the markers, to the currently selected floorplan
   */
  async function persistMarkersForFloorplan(
    floorplanIdToSave: string,
    markersToSave: Marker[]
  ): Promise<void> {
    if (!floorplanIdToSave) {
      error("No id for the selected floorplan");
      return;
    }

    try {
      setIsSavingMarkers(true);
      log("Prepering Makers payload payload");
      const serverReadyMarkers = prepareMarkersForServer(markersToSave);
      const floorplanCollectionIndex = storedMarkerCollections.findIndex(
        (collection) => collection.floorplanId === floorplanIdToSave
      );

      let nextCollections;

      if (floorplanCollectionIndex === -1) {
        // No existing collection
        const newCollection = {
          floorplanId: floorplanIdToSave,
          markers: serverReadyMarkers,
        };

        nextCollections = storedMarkerCollections.concat(newCollection);
      } else {
        // Existing collection
        nextCollections = storedMarkerCollections.map((collection, index) => {
          if (index === floorplanCollectionIndex) {
            return {
              ...collection,
              markers: serverReadyMarkers,
            };
          }

          return collection;
        });
      }

      log("Marker save step 2: sending marker collections to server");
      await saveFloorplanMarkerCollectionRecord({
        collections: nextCollections,
      });
      log("Marker save step 3: updating client marker collection state");
      setStoredMarkerCollections(nextCollections);
      log(`Successfully saved markers for floorplan ${floorplanIdToSave}`);
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";
      error(
        `Saving markers for floorplan ${floorplanIdToSave} failed: ${errorMessage}`
      );
      debug(`Could not save markers for floorplan: ${errorMessage}`);
    } finally {
      setIsSavingMarkers(false);
    }
  }

  const handleCanvasPress = (event: TapGestureEvent) => {
    if (!floorplan) {
      debug("No Floorplan");
      return;
    }

    const { x, y } = event;
    const existingMarker = marker.tryGetMarker(x, y);

    if (existingMarker) {
      setSelectedMarkerId(existingMarker.id);
      setShowMarkerOptions(true);
      setShowTempMarker(false);
      debug(`Trying to select existing Marker near (${x},${y})`);
    } else {
      // Create new marker position
      setTempMarker({ x, y });
      setShowTempMarker(true);
      debug(`Trying to set temp Marker at (${x},${y})`);
    }
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

        let floorplanImageRecord: FloorplanImageRecord = { floorplans: [] };

        try {
          floorplanImageRecord = await getFloorplanImageRecord();
          log(
            "Successfully fetched floorplan image record before gallery save"
          );
        } catch (caughtError) {
          const errorMessage =
            caughtError instanceof Error
              ? caughtError.message
              : "Unknown error";

          if (errorMessage !== "file not found") {
            error(
              `Fetching floorplan image record before gallery save failed: ${errorMessage}`
            );
            throw caughtError;
          }

          log("No existing floorplan image record found before gallery save");
        }

        const nextStoredFloorplan: FloorplanImage = {
          id: nextFloorplanId,
          imageUri,
          imageName: selectedFloorplanName,
          createdAt,
          imageBase64,
          imageFileExtension,
        };
        // Vi overskriver faktisk bare hele den eksisterende liste af floorplans hver gang
        const nextFloorplans =
          floorplanImageRecord.floorplans.concat(nextStoredFloorplan);
        await saveFloorplanImageRecord({ floorplans: nextFloorplans });
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

      await deleteFloorplanMarkerCollectionsForFloorplan(storedFloorplan.id);
      log(
        `Successfully deleted marker collection for floorplan ${storedFloorplan.id} from API`
      );
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
    setStoredMarkerCollections((currentCollections) =>
      currentCollections.filter(
        (collection) => collection.floorplanId !== storedFloorplan.id
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
    setStoredMarkerCollections([]);
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
        storedFloorplans,
        isLoadingStoredFloorplans,
        isSavingMarkers,
        pickFloorplan,
        pickFromMyFloorplan,
        refreshStoredFloorplans,
        clearAllUserData,
        deleteStoredFloorplan,
        handleCanvasPress,
        selectedMarker: selectedMarkerId
          ? marker.markers.find((m) => m.id === selectedMarkerId)
          : undefined,
        selectedMarkerId,
        setSelectedMarkerId,
        tempMarker,
        setTempMarker,
        showTempMarker,
        setShowTempMarker,
        showMarkerOptions,
        setShowMarkerOptions,
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
