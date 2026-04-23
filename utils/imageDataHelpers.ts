import { File } from "expo-file-system";

import { Marker } from "../hooks/useMarkers";
import { PhotoData } from "../models/PhotoFormModel";
import { FloorplanImage } from "./types";

export interface PreparedPhotoMetadata {
  base64: string;
  fileExtension: string;
}

export interface PreparedPhotosForUpload {
  preparedPhotoUris: string[];
  photoMetadataByUri: Record<string, PreparedPhotoMetadata>;
}

/**
 * Builds a data URI string from raw image data so React Native can render the
 * image directly without depending on a local file path.
 */
export function toImageDataUri(
  base64: string,
  fileExtension: string
): string {
  const normalizedExtension = fileExtension.toLowerCase();
  const mimeType =
    normalizedExtension === "jpg" || normalizedExtension === "jpeg"
      ? "image/jpeg"
      : normalizedExtension === "svg"
        ? "image/svg+xml"
        : `image/${normalizedExtension}`;

  return `data:${mimeType};base64,${base64}`;
}

/**
 * Ensures floorplans loaded from the server have a renderable image URI even
 * when older records still store base64 separately from imageUri.
 */
export function normalizeFloorplanImage(
  storedFloorplan: FloorplanImage
): FloorplanImage {
  if (
    storedFloorplan.imageUri.startsWith("data:") ||
    !storedFloorplan.imageBase64
  ) {
    return storedFloorplan;
  }

  return {
    ...storedFloorplan,
    imageUri: toImageDataUri(
      storedFloorplan.imageBase64,
      storedFloorplan.imageFileExtension ?? "png"
    ),
  };
}

/**
 * Ensures one photo record can be rendered directly from server-backed image
 * data instead of relying on a local device file path.
 */
export function normalizePhoto(photo: PhotoData): PhotoData {
  if (photo.photoUri.startsWith("data:") || !photo.photoBase64) {
    return photo;
  }

  return {
    ...photo,
    photoUri: toImageDataUri(
      photo.photoBase64,
      photo.photoFileExtension ?? "jpg"
    ),
  };
}

/**
 * Applies photo normalization across a full marker list so marker data from the
 * server is ready for UI use in one step.
 */
export function normalizeMarkers(markersToNormalize: Marker[]): Marker[] {
  return markersToNormalize.map((currentMarker) => ({
    ...currentMarker,
    photos: currentMarker.photos.map((photo) => normalizePhoto(photo)),
  }));
}

/**
 * Converts temporary local image URIs into data URIs and collects the metadata
 * needed later when the photo is submitted into a marker payload.
 */
export async function preparePhotosForUpload(
  photoUris: string[]
): Promise<PreparedPhotosForUpload> {
  const preparedPhotoUris: string[] = [];
  const photoMetadataByUri: Record<string, PreparedPhotoMetadata> = {};

  for (const photoUri of photoUris) {
    const fileExtensionMatch = photoUri.match(/\.(\w+)(\?.*)?$/);
    const fileExtension = fileExtensionMatch?.[1] ?? "jpg";
    const base64 = await new File(photoUri).base64();
    const preparedPhotoUri = toImageDataUri(base64, fileExtension);

    photoMetadataByUri[preparedPhotoUri] = {
      base64,
      fileExtension,
    };
    preparedPhotoUris.push(preparedPhotoUri);
  }

  return {
    preparedPhotoUris,
    photoMetadataByUri,
  };
}
