import { Directory, File, Paths } from "expo-file-system";
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
  saveFloorplanImageRecord,
  saveFloorplanMarkerCollectionRecord,
} from "../utils/api";
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
  pickFloorplan: () => Promise<void>;
  pickFromMyFloorplan: (storedFloorplan: FloorplanImage) => Promise<void>;
  refreshStoredFloorplans: () => Promise<void>;
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
  const [isLoadingStoredFloorplans, setIsLoadingStoredFloorplans] =
    useState(true);
  const marker = useMarkers();
  const { debug, error, log } = useLogger();
  const skippedMarkerSyncCount = useRef(0);

  const [showMarkerOptions, setShowMarkerOptions] = useState(false);

  const [tempMarker, setTempMarker] = useState<TempMarker>({ x: 0, y: 0 });
  const [showTempMarker, setShowTempMarker] = useState(false);

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  useEffect(() => {
    refreshStoredFloorplans().catch((error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      debug(`Could not refresh stored floorplans: ${errorMessage}`);
    });
  }, []);

  useEffect(() => {
    if (!floorplanId) {
      return;
    }

    if (skippedMarkerSyncCount.current > 0) {
      skippedMarkerSyncCount.current -= 1;
      return;
    }

    persistMarkersForSelectedFloorplan().catch((error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      debug(`Could not persist markers for floorplan: ${errorMessage}`);
    });
  }, [floorplanId, marker.markers]);

  async function refreshStoredFloorplans(): Promise<void> {
    setIsLoadingStoredFloorplans(true);

    try {
      const floorplanImageRecord = await getFloorplanImageRecord();
      log("Successfully fetched stored floorplans from API");
      setStoredFloorplans(floorplanImageRecord.floorplans);
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";

      if (errorMessage === "file not found") {
        log("Stored floorplans API returned no saved floorplans yet");
        setStoredFloorplans([]);
      } else {
        error(`Fetching stored floorplans failed: ${errorMessage}`);
        debug(`Could not fetch stored floorplans: ${errorMessage}`);
      }
    } finally {
      setIsLoadingStoredFloorplans(false);
    }
  }

  async function loadMarkersForStoredFloorplan(
    nextFloorplanId: string
  ): Promise<void> {
    try {
      const floorplanMarkerCollectionRecord =
        await getFloorplanMarkerCollectionRecord();
      log(`Successfully fetched markers for floorplan ${nextFloorplanId}`);
      const selectedCollection =
        floorplanMarkerCollectionRecord.collections.find(
          (collection) => collection.floorplanId === nextFloorplanId
        );

      skippedMarkerSyncCount.current += 1;
      marker.replaceMarkers(selectedCollection?.markers ?? []);
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";

      if (errorMessage === "file not found") {
        log(`No saved markers found for floorplan ${nextFloorplanId}`);
        skippedMarkerSyncCount.current += 1;
        marker.replaceMarkers([]);
      } else {
        error(
          `Fetching markers for floorplan ${nextFloorplanId} failed: ${errorMessage}`
        );
        debug(`Could not fetch markers for floorplan: ${errorMessage}`);
      }
    }
  }

  async function persistMarkersForSelectedFloorplan(): Promise<void> {
    if (!floorplanId) {
      return;
    }

    try {
      let floorplanMarkerCollectionRecord: FloorplanMarkerCollectionRecord = {
        collections: [],
      };

      try {
        floorplanMarkerCollectionRecord =
          await getFloorplanMarkerCollectionRecord();
        log(
          `Successfully fetched marker collections before saving floorplan ${floorplanId}`
        );
      } catch (caughtError) {
        const errorMessage =
          caughtError instanceof Error ? caughtError.message : "Unknown error";

        if (errorMessage !== "file not found") {
          error(
            `Fetching marker collections before save failed: ${errorMessage}`
          );
          throw caughtError;
        }

        log(
          `No existing marker collection file found before saving floorplan ${floorplanId}`
        );
      }

      const floorplanCollectionIndex =
        floorplanMarkerCollectionRecord.collections.findIndex(
          (collection) => collection.floorplanId === floorplanId
        );

      const nextCollections =
        floorplanCollectionIndex === -1
          ? floorplanMarkerCollectionRecord.collections.concat({
              floorplanId,
              markers: marker.markers,
            })
          : floorplanMarkerCollectionRecord.collections.map(
              (collection, collectionIndex) =>
                collectionIndex === floorplanCollectionIndex
                  ? { ...collection, markers: marker.markers }
                  : collection
            );

      await saveFloorplanMarkerCollectionRecord({
        collections: nextCollections,
      });
      log(`Successfully saved markers for floorplan ${floorplanId}`);
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";
      error(
        `Saving markers for floorplan ${floorplanId} failed: ${errorMessage}`
      );
      debug(`Could not save markers for floorplan: ${errorMessage}`);
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
        const imagesDirectory = new Directory(
          Paths.document,
          "floorplan-images"
        );

        if (!imagesDirectory.exists) {
          imagesDirectory.create();
        }

        const createdAt = new Date().toISOString();
        const nextFloorplanId = `floorplan-${Date.now()}`;
        const selectedFloorplanName =
          selectedFloorplanImage.fileName?.trim() ||
          `Gallery floorplan ${createdAt}`;
        const outputUri =
          imagesDirectory.uri + `/${nextFloorplanId}-${selectedFloorplanName}`;

        const destinationFile = new File(outputUri);
        const sourceFile = new File(selectedFloorplanImage.uri);
        sourceFile.copy(destinationFile);

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
          imageUri: outputUri,
          imageName: selectedFloorplanName,
          createdAt,
        };

        await saveFloorplanImageRecord({
          floorplans:
            floorplanImageRecord.floorplans.concat(nextStoredFloorplan),
        });
        log(`Successfully saved gallery floorplan ${nextFloorplanId} to API`);

        await refreshStoredFloorplans();
        log("Successfully refreshed stored floorplans after gallery save");

        skippedMarkerSyncCount.current += 1;
        setFloorplanId(nextStoredFloorplan.id);
        setFloorplan(nextStoredFloorplan.imageUri);
        setSelectedMarkerId(null);
        setShowMarkerOptions(false);
        setShowTempMarker(false);
        marker.clearMarkers();
      } catch (caughtError) {
        const errorMessage =
          caughtError instanceof Error ? caughtError.message : "Unknown error";
        error(`Saving gallery floorplan failed: ${errorMessage}`);
        throw caughtError;
      }
    }
  };

  const pickFromMyFloorplan = async (storedFloorplan: FloorplanImage) => {
    skippedMarkerSyncCount.current += 1;
    setFloorplanId(storedFloorplan.id);
    setFloorplan(storedFloorplan.imageUri);
    setSelectedMarkerId(null);
    setShowMarkerOptions(false);
    setShowTempMarker(false);

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

    if (floorplanId === storedFloorplan.id) {
      setFloorplanId(null);
      setFloorplan(null);
      setSelectedMarkerId(null);
      setShowMarkerOptions(false);
      setShowTempMarker(false);
      marker.clearMarkers();
    }
  };

  return (
    <FloorplanContext.Provider
      value={{
        ...marker,
        floorplanId,
        floorplan,
        storedFloorplans,
        isLoadingStoredFloorplans,
        pickFloorplan,
        pickFromMyFloorplan,
        refreshStoredFloorplans,
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
