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

const FLOORPLAN_IMAGES_DIRECTORY_NAME = "floorplan-images";
// Local cache files let the app render quickly before server reconciliation.
const LOCAL_FLOORPLAN_CACHE_FILE_NAME = "floorplans-local-cache.json";
const LOCAL_MARKER_CACHE_FILE_NAME = "floorplan-markers-local-cache.json";

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
    loadLocalThenServer().catch((error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      debug(`Could not hydrate local sync state: ${errorMessage}`);
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

  // Getters for our local cashe, is stored on the phone.
  function getLocalFloorplanCacheFile() {
    return new File(Paths.document, LOCAL_FLOORPLAN_CACHE_FILE_NAME);
  }
  // Same stuff
  function getLocalMarkerCacheFile() {
    return new File(Paths.document, LOCAL_MARKER_CACHE_FILE_NAME);
  }

  /**
   * gets the locally cached floorplan metadata
   */
  async function readLocalFloorplanImageRecord(): Promise<FloorplanImageRecord> {
    const cacheFile = getLocalFloorplanCacheFile();

    if (!cacheFile.exists) {
      return { floorplans: [] };
    }

    return JSON.parse(await cacheFile.text()) as FloorplanImageRecord;
  }

  async function writeLocalFloorplanImageRecord(
    floorplanImageRecord: FloorplanImageRecord
  ): Promise<void> {
    const cacheFile = getLocalFloorplanCacheFile();
    cacheFile.write(JSON.stringify(floorplanImageRecord));
  }

  async function readLocalMarkerCollectionRecord(): Promise<FloorplanMarkerCollectionRecord> {
    const cacheFile = getLocalMarkerCacheFile();
    if (!cacheFile.exists) {
      return { collections: [] };
    }

    return JSON.parse(await cacheFile.text()) as FloorplanMarkerCollectionRecord;
  }

  async function writeLocalMarkerCollectionRecord(
    floorplanMarkerCollectionRecord: FloorplanMarkerCollectionRecord
  ): Promise<void> {
    const cacheFile = getLocalMarkerCacheFile();
    cacheFile.write(JSON.stringify(floorplanMarkerCollectionRecord));
  }

  /**
   * Ensures a floorplan image exists locally. If the file is missing but the
   * server-backed base64 payload exists, recreate the local file from it.
   */
  async function restoreFloorplanImageIfNeeded(
    storedFloorplan: FloorplanImage
  ): Promise<FloorplanImage> {
    const localFloorplanFile = new File(storedFloorplan.imageUri);

    if (localFloorplanFile.exists || !storedFloorplan.imageBase64) {
      return storedFloorplan;
    }

    const imagesDirectory = new Directory(
      Paths.document,
      FLOORPLAN_IMAGES_DIRECTORY_NAME
    );
    if (!imagesDirectory.exists) {
      imagesDirectory.create();
    }

    const fileExtension = storedFloorplan.imageFileExtension ?? "png";
    const restoredFloorplanUri =
      imagesDirectory.uri + `/${storedFloorplan.id}.${fileExtension}`;
    const restoredFloorplanFile = new File(restoredFloorplanUri);
    restoredFloorplanFile.create({ intermediates: true, overwrite: true });
    restoredFloorplanFile.write(storedFloorplan.imageBase64, {
      encoding: "base64",
    });

    return {
      ...storedFloorplan,
      imageUri: restoredFloorplanUri,
    };
  }

  /**
   * Restores local floorplan files for a batch of floorplans before they are
   * displayed or written back into local cache.
   */

  async function restoreFloorplanImages(
    floorplansToRestore: FloorplanImage[]
  ): Promise<FloorplanImage[]> {
    const restorePromises = floorplansToRestore.map((floorplan) =>
      restoreFloorplanImageIfNeeded(floorplan)
    );

    const restoredFloorplans = await Promise.all(restorePromises);

    return restoredFloorplans;
  }

  /**
   * Fetches the floorplan list from the server. and updates the local cache to match.
   */
  async function refreshStoredFloorplans(): Promise<void> {
    try {
      const floorplanImageRecord = await getFloorplanImageRecord();
      const restoredFloorplans = await restoreFloorplanImages(
        floorplanImageRecord.floorplans
      );
      log("Successfully fetched stored floorplans from API");
      setStoredFloorplans(restoredFloorplans);
      await writeLocalFloorplanImageRecord({ floorplans: restoredFloorplans });
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";

      if (errorMessage === "file not found") {
        log("Stored floorplans API returned no saved floorplans yet");
        setStoredFloorplans([]);
        await writeLocalFloorplanImageRecord({ floorplans: [] });
      } else {
        error(`Fetching stored floorplans failed: ${errorMessage}`);
        debug(`Could not fetch stored floorplans: ${errorMessage}`);
      }
    }
  }

  /**
   * 1. Read cached floorplans from local storage.
   * 2. If a floorplan is already selected, restore its cached markers and marker photos.
   * 3. Fetch the latest floorplans from the server and update local state/cache to match
   *    the server version.
   */
  async function loadLocalThenServer(): Promise<void> {
    setIsLoadingStoredFloorplans(true);

    try {
      const localFloorplanImageRecord = await readLocalFloorplanImageRecord();
      const restoredLocalFloorplans = await restoreFloorplanImages(
        localFloorplanImageRecord.floorplans
      );

      setStoredFloorplans(restoredLocalFloorplans);


      if (floorplanId) {
        const localMarkerCollectionRecord = await readLocalMarkerCollectionRecord();
        const localCollection = localMarkerCollectionRecord.collections.find(
          (collection) => collection.floorplanId === floorplanId
        );

        if (localCollection) {
          skippedMarkerSyncCount.current += 1;
          marker.replaceMarkers(await restoreMarkerPhotos(localCollection.markers));
        }
      }
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";
      error(`Could not hydrate local cache: ${errorMessage}`);
    }

    try {
      await refreshStoredFloorplans();
    } finally {
      setIsLoadingStoredFloorplans(false);
    }
  }

  /**
   * Ensures a marker photo exists locally. If the local file is missing but
   * the photo record still has base64 payload from the server, recreate it.
   */
  async function restoreMarkerPhotoIfNeeded(photo: PhotoData): Promise<PhotoData> {
    const localPhotoFile = new File(photo.photoUri);

    if (localPhotoFile.exists || !photo.photoBase64) {
      return photo;
    }

    const markerImagesDirectory = new Directory(Paths.document, "marker-images");
    if (!markerImagesDirectory.exists) {
      markerImagesDirectory.create();
    }

    const fileExtension = photo.photoFileExtension ?? "jpg";
    const restoredPhotoUri =
      markerImagesDirectory.uri +
      `/marker-photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExtension}`;

    const restoredPhotoFile = new File(restoredPhotoUri);
    restoredPhotoFile.create({ intermediates: true, overwrite: true });
    restoredPhotoFile.write(photo.photoBase64, { encoding: "base64" });

    return {
      ...photo,
      photoUri: restoredPhotoUri,
    };
  }

  /**
   * Restores local marker photo files for an entire marker collection.
   */
  async function restoreMarkerPhotos(
    markersToRestore: Marker[]
  ): Promise<Marker[]> {
    return Promise.all(
      markersToRestore.map(async (currentMarker) => ({
        ...currentMarker,
        photos: await Promise.all(
          currentMarker.photos.map((photo) => restoreMarkerPhotoIfNeeded(photo))
        ),
      }))
    );
  }

  /**
   * Loads one floorplan's markers from the server, repairs missing local photo
   * files, and refreshes the local marker cache with the server-priority state.
   */
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
      const restoredMarkers = await restoreMarkerPhotos(
        selectedCollection?.markers ?? []
      );
      const localMarkerCollectionRecord = await readLocalMarkerCollectionRecord();
      const nextCollections =
        localMarkerCollectionRecord.collections.some(
          (collection) => collection.floorplanId === nextFloorplanId
        )
          ? localMarkerCollectionRecord.collections.map((collection) =>
            collection.floorplanId === nextFloorplanId
              ? { ...collection, markers: restoredMarkers }
              : collection
          )
          : localMarkerCollectionRecord.collections.concat({
            floorplanId: nextFloorplanId,
            markers: restoredMarkers,
          });
      await writeLocalMarkerCollectionRecord({ collections: nextCollections });

      skippedMarkerSyncCount.current += 1;
      marker.replaceMarkers(restoredMarkers);
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";

      if (errorMessage === "file not found") {
        log(`No saved markers found for floorplan ${nextFloorplanId}`);
        const localMarkerCollectionRecord = await readLocalMarkerCollectionRecord();
        await writeLocalMarkerCollectionRecord({
          collections: localMarkerCollectionRecord.collections.filter(
            (collection) => collection.floorplanId !== nextFloorplanId
          ),
        });
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

  /**
   * Persists the current in-memory marker state for the selected floorplan to
   * both the server record and the local cache.
   */
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
      await writeLocalMarkerCollectionRecord({
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
          FLOORPLAN_IMAGES_DIRECTORY_NAME
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
        const imageFileExtension =
          selectedFloorplanImage.fileName?.match(/\.([^.]+)$/)?.[1] ?? "jpg";

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
          imageBase64: await destinationFile.base64(),
          imageFileExtension,
        };

        const nextFloorplans =
          floorplanImageRecord.floorplans.concat(nextStoredFloorplan);
        await saveFloorplanImageRecord({ floorplans: nextFloorplans });
        await writeLocalFloorplanImageRecord({ floorplans: nextFloorplans });
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
    const restoredFloorplan = await restoreFloorplanImageIfNeeded(
      storedFloorplan
    );
    skippedMarkerSyncCount.current += 1;
    setFloorplanId(restoredFloorplan.id);
    setFloorplan(restoredFloorplan.imageUri);
    setSelectedMarkerId(null);
    setShowMarkerOptions(false);
    setShowTempMarker(false);

    const localMarkerCollectionRecord = await readLocalMarkerCollectionRecord();
    const localCollection = localMarkerCollectionRecord.collections.find(
      (collection) => collection.floorplanId === restoredFloorplan.id
    );
    if (localCollection) {
      skippedMarkerSyncCount.current += 1;
      marker.replaceMarkers(await restoreMarkerPhotos(localCollection.markers));
    } else {
      skippedMarkerSyncCount.current += 1;
      marker.replaceMarkers([]);
    }

    await loadMarkersForStoredFloorplan(restoredFloorplan.id);
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
    const localFloorplanImageRecord = await readLocalFloorplanImageRecord();
    await writeLocalFloorplanImageRecord({
      floorplans: localFloorplanImageRecord.floorplans.filter(
        (currentFloorplan) => currentFloorplan.id !== storedFloorplan.id
      ),
    });
    const localMarkerCollectionRecord = await readLocalMarkerCollectionRecord();
    await writeLocalMarkerCollectionRecord({
      collections: localMarkerCollectionRecord.collections.filter(
        (collection) => collection.floorplanId !== storedFloorplan.id
      ),
    });

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
