import Constants from "expo-constants";

import {
  ApiErrorResponse,
  FloorplanImage,
  FloorplanImageRecord,
  FloorplanMarker,
  FloorplanMarkerCollection,
  FloorplanMarkerCollectionRecord,
} from "./types";
// Should be False, whenever you are not testing locally
const USE_LOCAL_API = true;
// THIS IS FOR TESTING ONLY.  this was my local IPv4 Address
// For you may need to change it.  run ipconfig to se your adress
const LOCAL_API_BASE_URL = "http://10.27.48.86:5000/api";


const PROD_API_BASE_URL = "http://130.225.39.166:5000/api";

const API_BASE_URL =
  process.env.P8_API_BASE_URL ??
  (USE_LOCAL_API ? LOCAL_API_BASE_URL : PROD_API_BASE_URL);
const rawDeviceUserName =
  process.env.P8_API_USER ?? Constants.deviceName ?? "unknown-device";

export const API_USER =
  rawDeviceUserName.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) ||
  "unknown-device";

/**
 * Build the URL for listing or creating floorplans for the current API user.
 */
function userFloorplansUrl(): string {
  return `${API_BASE_URL}/users/${API_USER}/floorplans`;
}

/**
 * Build the URL for listing or creating markers for one floorplan id.
 */
function floorplanMarkersUrl(floorplanId: string): string {
  return `${API_BASE_URL}/users/${API_USER}/floorplans/${floorplanId}/markers`;
}

/**
 * Build the URL for one specific floorplan id.
 */
function floorplanUrl(floorplanId: string): string {
  return `${API_BASE_URL}/users/${API_USER}/floorplans/${floorplanId}`;
}

/**
 * Build the URL for one specific marker inside one floorplan.
 */
function markerUrl(floorplanId: string, markerId: string): string {
  return `${floorplanMarkersUrl(floorplanId)}/${markerId}`;
}

/**
 * Build the URL for updating only the coordinates of one marker.
 */
function markerCoordinatesUrl(floorplanId: string, markerId: string): string {
  return `${markerUrl(floorplanId, markerId)}/coordinates`;
}

/**
 * Read the server error message from a failed response.
 *
 * The response input is the failed fetch response. If the body does not contain
 * a usable error field, the function falls back to the provided message.
 */
async function readApiError(response: Response, fallbackMessage: string) {
  try {
    const errorResponse = (await response.json()) as ApiErrorResponse;
    return errorResponse.error ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

/**
 * Send a DELETE request and throw if the server does not accept it.
 *
 * The url input decides which resource to delete, and fallbackMessage is used
 * when the server does not return a readable error body.
 */
async function deleteOrThrow(
  url: string,
  fallbackMessage: string
): Promise<void> {
  const response = await fetch(url, { method: "DELETE" });

  if (!response.ok) {
    const errorMessage = await readApiError(response, fallbackMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Fetch all floorplans for the current API user.
 *
 * The function calls the server endpoint for the current user and returns the
 * floorplan array exactly as the server stores it.
 */
async function getRemoteFloorplans(): Promise<FloorplanImage[]> {
  const response = await fetch(userFloorplansUrl());

  if (!response.ok) {
    const errorMessage = await readApiError(
      response,
      `Getting floorplan images failed with status ${response.status}`
    );
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as {
    floorplans: FloorplanImage[];
  };
  return data.floorplans;
}

/**
 * Fetch all markers for one floorplan id.
 *
 * The floorplanId input selects which floorplan to read markers from on the
 * server, and the returned value is the list of marker objects for that plan.
 */
async function getRemoteMarkersForFloorplan(
  floorplanId: string
): Promise<FloorplanMarker[]> {
  const response = await fetch(floorplanMarkersUrl(floorplanId));

  if (!response.ok) {
    const errorMessage = await readApiError(
      response,
      `Getting floorplan markers failed with status ${response.status}`
    );
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as {
    markers: FloorplanMarker[];
  };
  return data.markers;
}

/**
 * Append one new floorplan on the server.
 *
 * The floorplan input is sent directly to the server. The server adds metadata
 * and rejects the request if a floorplan with the same id already exists.
 */
export async function createFloorplanImage(
  floorplan: FloorplanImage
): Promise<void> {
  const response = await fetch(userFloorplansUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(floorplan),
  });

  if (!response.ok) {
    const errorMessage = await readApiError(
      response,
      `Saving floorplan images failed with status ${response.status}`
    );
    throw new Error(errorMessage);
  }
}

/**
 * Append one new marker to one floorplan on the server.
 *
 * The floorplanId input selects the floorplan, and marker is the marker object
 * to create. The server adds metadata and rejects duplicates.
 */
export async function createFloorplanMarker(
  floorplanId: string,
  marker: FloorplanMarker
): Promise<void> {
  const response = await fetch(floorplanMarkersUrl(floorplanId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(marker),
  });

  if (!response.ok) {
    const errorMessage = await readApiError(
      response,
      `Saving floorplan markers failed with status ${response.status}`
    );
    throw new Error(errorMessage);
  }
}

/**
 * Update only x and y for one existing marker.
 *
 * The floorplanId and marker.id inputs identify the marker, and only the
 * coordinate fields are sent so we stay inside the server's overwrite rules.
 */
export async function updateFloorplanMarkerCoordinates(
  floorplanId: string,
  marker: FloorplanMarker
): Promise<void> {
  const response = await fetch(markerCoordinatesUrl(floorplanId, marker.id), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      x: marker.x,
      y: marker.y,
    }),
  });

  if (!response.ok) {
    const errorMessage = await readApiError(
      response,
      `Updating marker coordinates failed with status ${response.status}`
    );
    throw new Error(errorMessage);
  }
}

/**
 * Replace one marker by deleting it and creating it again.
 *
 * This is used when more than coordinates changed, because the server only
 * allows direct overwriting of marker coordinates.
 */
export async function replaceFloorplanMarker(
  floorplanId: string,
  marker: FloorplanMarker
): Promise<void> {
  await deleteOrThrow(
    markerUrl(floorplanId, marker.id),
    `Deleting floorplan marker failed`
  );
  await createFloorplanMarker(floorplanId, marker);
}

/**
 * Make the server floorplan list match the provided floorplan record.
 *
 * The function compares the current server state with floorplanImageRecord,
 * deletes removed floorplans, appends new ones, and replaces changed ones by
 * delete+create because the server does not allow generic overwrite.
 */
export async function saveFloorplanImageRecord(
  floorplanImageRecord: FloorplanImageRecord
): Promise<void> {
  let remoteFloorplans: FloorplanImage[] = [];

  try {
    remoteFloorplans = await getRemoteFloorplans();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    if (errorMessage !== "file not found") {
      throw error;
    }
  }

  const remoteFloorplanById = new Map(
    remoteFloorplans.map((floorplan) => [floorplan.id, floorplan])
  );
  const nextFloorplanIds = new Set(
    floorplanImageRecord.floorplans.map((floorplan) => floorplan.id)
  );

  for (const remoteFloorplan of remoteFloorplans) {
    if (!nextFloorplanIds.has(remoteFloorplan.id)) {
      await deleteOrThrow(
        floorplanUrl(remoteFloorplan.id),
        `Deleting floorplan image failed`
      );
    }
  }

  for (const nextFloorplan of floorplanImageRecord.floorplans) {
    const remoteFloorplan = remoteFloorplanById.get(nextFloorplan.id);

    if (!remoteFloorplan) {
      await createFloorplanImage(nextFloorplan);
      continue;
    }

    if (JSON.stringify(remoteFloorplan) === JSON.stringify(nextFloorplan)) {
      continue;
    }

    await deleteOrThrow(
      floorplanUrl(nextFloorplan.id),
      `Deleting floorplan image failed`
    );
    await createFloorplanImage(nextFloorplan);
  }
}

/**
 * Fetch all saved floorplans for the current API user.
 */
export async function getFloorplanImageRecord(): Promise<FloorplanImageRecord> {
  const floorplans = await getRemoteFloorplans();
  return { floorplans };
}

/**
 * Fetch all markers for one floorplan.
 */
export async function getFloorplanMarkers(
  floorplanId: string
): Promise<FloorplanMarker[]> {
  return await getRemoteMarkersForFloorplan(floorplanId);
}

/**
 * Delete one floorplan by id from the server.
 *
 * The floorplanId input selects the floorplan directory to remove.
 */
export async function deleteFloorplanImageRecord(
  floorplanId: string
): Promise<void> {
  await deleteOrThrow(
    floorplanUrl(floorplanId),
    `Deleting floorplan image failed`
  );
}

/**
 * Make the server marker collections match the provided record.
 *
 * Each collection is synced against its floorplan individually. Collections for
 * floorplans that now have no local collection are synced to an empty marker
 * list so stale markers are removed from the server.
 */
export async function saveFloorplanMarkerCollectionRecord(
  floorplanMarkerCollectionRecord: FloorplanMarkerCollectionRecord
): Promise<void> {
  const remoteFloorplans = await getRemoteFloorplans();
  const remoteFloorplanIds = new Set(
    remoteFloorplans.map((floorplan) => floorplan.id)
  );

  for (const collection of floorplanMarkerCollectionRecord.collections) {
    if (!remoteFloorplanIds.has(collection.floorplanId)) {
      continue;
    }

    const remoteMarkers = await getRemoteMarkersForFloorplan(
      collection.floorplanId
    );
    const remoteMarkerById = new Map(
      remoteMarkers.map((marker) => [marker.id, marker])
    );
    const nextMarkerIds = new Set(
      collection.markers.map((marker) => marker.id)
    );

    for (const remoteMarker of remoteMarkers) {
      if (!nextMarkerIds.has(remoteMarker.id)) {
        await deleteOrThrow(
          markerUrl(collection.floorplanId, remoteMarker.id),
          `Deleting floorplan marker failed`
        );
      }
    }

    for (const nextMarker of collection.markers) {
      const remoteMarker = remoteMarkerById.get(nextMarker.id);

      if (!remoteMarker) {
        await createFloorplanMarker(collection.floorplanId, nextMarker);
        continue;
      }

      if (JSON.stringify(remoteMarker) === JSON.stringify(nextMarker)) {
        continue;
      }

      const coordinatesChanged =
        remoteMarker.x !== nextMarker.x || remoteMarker.y !== nextMarker.y;
      const otherFieldsChanged =
        JSON.stringify({ ...remoteMarker, x: undefined, y: undefined }) !==
        JSON.stringify({ ...nextMarker, x: undefined, y: undefined });

      if (coordinatesChanged && !otherFieldsChanged) {
        await updateFloorplanMarkerCoordinates(
          collection.floorplanId,
          nextMarker
        );
        continue;
      }

      await replaceFloorplanMarker(collection.floorplanId, nextMarker);
    }
  }

  for (const remoteFloorplan of remoteFloorplans) {
    const stillExists = floorplanMarkerCollectionRecord.collections.some(
      (collection) => collection.floorplanId === remoteFloorplan.id
    );

    if (!stillExists) {
      const remoteMarkers = await getRemoteMarkersForFloorplan(
        remoteFloorplan.id
      );
      for (const remoteMarker of remoteMarkers) {
        await deleteOrThrow(
          markerUrl(remoteFloorplan.id, remoteMarker.id),
          `Deleting floorplan marker failed`
        );
      }
    }
  }
}

/**
 * Fetch markers for every saved floorplan and return them as one record.
 */
export async function getFloorplanMarkerCollectionRecord(): Promise<FloorplanMarkerCollectionRecord> {
  const floorplans = await getRemoteFloorplans();
  const collections: FloorplanMarkerCollection[] = [];

  for (const floorplan of floorplans) {
    const markers = await getRemoteMarkersForFloorplan(floorplan.id);
    collections.push({
      floorplanId: floorplan.id,
      markers,
    });
  }

  return { collections };
}

/**
 * Delete all markers for one floorplan by syncing it to an empty list.
 */
export async function deleteFloorplanMarkerCollectionsForFloorplan(
  floorplanId: string
): Promise<void> {
  const markers = await getRemoteMarkersForFloorplan(floorplanId);

  for (const marker of markers) {
    await deleteOrThrow(
      markerUrl(floorplanId, marker.id),
      `Deleting floorplan marker failed`
    );
  }
}

/**
 * Delete one marker from one floorplan.
 */
export async function deleteFloorplanMarker(
  floorplanId: string,
  markerId: string
): Promise<void> {
  await deleteOrThrow(
    markerUrl(floorplanId, markerId),
    `Deleting floorplan marker failed`
  );
}

/**
 * Delete all server data for the current API user.
 *
 * This calls the reset endpoint, which removes the whole user folder and all
 * floorplans and markers inside it.
 */
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
