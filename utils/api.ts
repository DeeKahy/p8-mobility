import Constants from "expo-constants";

import {
  ApiErrorResponse,
  FloorplanFileListResponse,
  FloorplanImageRecord,
  FloorplanMarkerCollectionRecord,
} from "./types";

const API_BASE_URL = "http://130.225.39.166:5000/api";
const rawDeviceUserName =
  process.env.P8_API_USER ?? Constants.deviceName ?? "unknown-device";

export const API_USER =
  rawDeviceUserName.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) ||
  "unknown-device";

const FLOORPLAN_IMAGE_FILE_NAME = "floorplans-image";
const FLOORPLAN_MARKERS_FILE_NAME = "floorplan-markers";

export async function saveFloorplanImageRecord(
  floorplanImageRecord: FloorplanImageRecord
): Promise<void> {
  const saveFloorplanImageUrl = `${API_BASE_URL}/saveData/${API_USER}/${FLOORPLAN_IMAGE_FILE_NAME}`;

  const saveFloorplanImageResponse = await fetch(saveFloorplanImageUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(floorplanImageRecord),
  });

  if (!saveFloorplanImageResponse.ok) {
    const saveFloorplanImageError =
      ((await saveFloorplanImageResponse.json()) as ApiErrorResponse).error ??
      `Saving floorplan images failed with status ${saveFloorplanImageResponse.status}`;

    throw new Error(saveFloorplanImageError);
  }
}

export async function getFloorplanImageRecord(): Promise<FloorplanImageRecord> {
  const getFloorplanImageUrl = `${API_BASE_URL}/getData/${API_USER}/${FLOORPLAN_IMAGE_FILE_NAME}`;

  const getFloorplanImageResponse = await fetch(getFloorplanImageUrl);

  if (!getFloorplanImageResponse.ok) {
    const getFloorplanImageError =
      ((await getFloorplanImageResponse.json()) as ApiErrorResponse).error ??
      `Getting floorplan images failed with status ${getFloorplanImageResponse.status}`;

    throw new Error(getFloorplanImageError);
  }

  return (await getFloorplanImageResponse.json()) as FloorplanImageRecord;
}

export async function deleteFloorplanImageRecord(
  floorplanId: string
): Promise<void> {
  const getFloorplanImageUrl = `${API_BASE_URL}/getData/${API_USER}/${FLOORPLAN_IMAGE_FILE_NAME}`;

  const getFloorplanImageResponse = await fetch(getFloorplanImageUrl);

  if (!getFloorplanImageResponse.ok) {
    const getFloorplanImageError =
      ((await getFloorplanImageResponse.json()) as ApiErrorResponse).error ??
      `Getting floorplan images failed with status ${getFloorplanImageResponse.status}`;

    throw new Error(getFloorplanImageError);
  }

  const floorplanImageRecord =
    (await getFloorplanImageResponse.json()) as FloorplanImageRecord;
  const filteredFloorplans = floorplanImageRecord.floorplans.filter(
    (floorplan) => floorplan.id !== floorplanId
  );

  if (filteredFloorplans.length === floorplanImageRecord.floorplans.length) {
    throw new Error(`Floorplan ${floorplanId} was not found`);
  }

  const saveFloorplanImageUrl = `${API_BASE_URL}/saveData/${API_USER}/${FLOORPLAN_IMAGE_FILE_NAME}`;

  const saveFloorplanImageResponse = await fetch(saveFloorplanImageUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ floorplans: filteredFloorplans }),
  });

  if (!saveFloorplanImageResponse.ok) {
    const saveFloorplanImageError =
      ((await saveFloorplanImageResponse.json()) as ApiErrorResponse).error ??
      `Deleting floorplan image failed with status ${saveFloorplanImageResponse.status}`;

    throw new Error(saveFloorplanImageError);
  }
}

export async function saveFloorplanMarkerCollectionRecord(
  floorplanMarkerCollectionRecord: FloorplanMarkerCollectionRecord
): Promise<void> {
  
  const saveFloorplanMarkerCollectionUrl = `${API_BASE_URL}/saveData/${API_USER}/${FLOORPLAN_MARKERS_FILE_NAME}`;
  const requestBody = JSON.stringify(floorplanMarkerCollectionRecord);
  console.log("Sending photo, this takes a while because we need to sent everything all the time.")
  const saveFloorplanMarkerCollectionResponse = await fetch(
    saveFloorplanMarkerCollectionUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: requestBody,
    }
  );

  if (!saveFloorplanMarkerCollectionResponse.ok) {
    const saveFloorplanMarkerCollectionError =
      ((await saveFloorplanMarkerCollectionResponse.json()) as ApiErrorResponse)
        .error ??
      `Saving floorplan markers failed with status ${saveFloorplanMarkerCollectionResponse.status}`;

    throw new Error(saveFloorplanMarkerCollectionError);
  }
}

export async function getFloorplanMarkerCollectionRecord(): Promise<FloorplanMarkerCollectionRecord> {
  const getFloorplanMarkerCollectionUrl = `${API_BASE_URL}/getData/${API_USER}/${FLOORPLAN_MARKERS_FILE_NAME}`;

  const getFloorplanMarkerCollectionResponse = await fetch(
    getFloorplanMarkerCollectionUrl
  );

  if (!getFloorplanMarkerCollectionResponse.ok) {
    const getFloorplanMarkerCollectionError =
      ((await getFloorplanMarkerCollectionResponse.json()) as ApiErrorResponse)
        .error ??
      `Getting floorplan markers failed with status ${getFloorplanMarkerCollectionResponse.status}`;

    throw new Error(getFloorplanMarkerCollectionError);
  }

  return (await getFloorplanMarkerCollectionResponse.json()) as FloorplanMarkerCollectionRecord;
}



export async function deleteFloorplanMarkerCollectionsForFloorplan(
  floorplanId: string
): Promise<void> {
  const getFloorplanMarkerCollectionUrl = `${API_BASE_URL}/getData/${API_USER}/${FLOORPLAN_MARKERS_FILE_NAME}`;

  const getFloorplanMarkerCollectionResponse = await fetch(
    getFloorplanMarkerCollectionUrl
  );

  if (!getFloorplanMarkerCollectionResponse.ok) {
    const getFloorplanMarkerCollectionError =
      ((await getFloorplanMarkerCollectionResponse.json()) as ApiErrorResponse)
        .error ??
      `Getting floorplan markers failed with status ${getFloorplanMarkerCollectionResponse.status}`;

    if (getFloorplanMarkerCollectionError === "file not found") {
      return;
    }

    throw new Error(getFloorplanMarkerCollectionError);
  }

  const floorplanMarkerCollectionRecord =
    (await getFloorplanMarkerCollectionResponse.json()) as FloorplanMarkerCollectionRecord;
  const filteredCollections =
    floorplanMarkerCollectionRecord.collections.filter(
      (collection) => collection.floorplanId !== floorplanId
    );

  const saveFloorplanMarkerCollectionUrl = `${API_BASE_URL}/saveData/${API_USER}/${FLOORPLAN_MARKERS_FILE_NAME}`;

  const saveFloorplanMarkerCollectionResponse = await fetch(
    saveFloorplanMarkerCollectionUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ collections: filteredCollections }),
    }
  );

  if (!saveFloorplanMarkerCollectionResponse.ok) {
    const saveFloorplanMarkerCollectionError =
      ((await saveFloorplanMarkerCollectionResponse.json()) as ApiErrorResponse)
        .error ??
      `Deleting floorplan marker collection failed with status ${saveFloorplanMarkerCollectionResponse.status}`;

    throw new Error(saveFloorplanMarkerCollectionError);
  }
}


export async function resetUserData(): Promise<void> {
  const resetUserUrl = `${API_BASE_URL}/resetUser/${API_USER}`;

  const resetUserResponse = await fetch(resetUserUrl, {
    method: "DELETE",
  });

  if (!resetUserResponse.ok) {
    const resetUserError =
      ((await resetUserResponse.json()) as ApiErrorResponse).error ??
      `Resetting user data failed with status ${resetUserResponse.status}`;

    throw new Error(resetUserError);
  }
}
