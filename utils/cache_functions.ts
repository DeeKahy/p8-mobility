import { File, Paths } from "expo-file-system";

import {
  FloorplanImageRecord,
  FloorplanMarkerCollectionRecord,
} from "./types";

const LOCAL_FLOORPLAN_CACHE_FILE_NAME = "floorplans-local-cache.json";
const LOCAL_MARKER_CACHE_FILE_NAME = "floorplan-markers-local-cache.json";

function getLocalFloorplanCacheFile() {
  return new File(Paths.document, LOCAL_FLOORPLAN_CACHE_FILE_NAME);
}

function getLocalMarkerCacheFile() {
  return new File(Paths.document, LOCAL_MARKER_CACHE_FILE_NAME);
}

export async function readLocalFloorplanImageRecord(): Promise<FloorplanImageRecord> {
  const cacheFile = getLocalFloorplanCacheFile();

  if (!cacheFile.exists) {
    return { floorplans: [] };
  }

  return JSON.parse(await cacheFile.text()) as FloorplanImageRecord;
}

export async function writeLocalFloorplanImageRecord(
  floorplanImageRecord: FloorplanImageRecord
): Promise<void> {
  const cacheFile = getLocalFloorplanCacheFile();
  cacheFile.write(JSON.stringify(floorplanImageRecord));
}

export async function readLocalMarkerCollectionRecord(): Promise<FloorplanMarkerCollectionRecord> {
  const cacheFile = getLocalMarkerCacheFile();

  if (!cacheFile.exists) {
    return { collections: [] };
  }

  return JSON.parse(await cacheFile.text()) as FloorplanMarkerCollectionRecord;
}

export async function writeLocalMarkerCollectionRecord(
  floorplanMarkerCollectionRecord: FloorplanMarkerCollectionRecord
): Promise<void> {
  const cacheFile = getLocalMarkerCacheFile();
  cacheFile.write(JSON.stringify(floorplanMarkerCollectionRecord));
}
