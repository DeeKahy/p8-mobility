import { useState } from "react";

import { PhotoData } from "../models/PhotoFormModel";

export type MarkerContent = { id: string; photos: PhotoData[] };

export type Marker = MarkerContent & { x: number; y: number };

// Throw this error when you want the affected marker to be deleted by editMarker instead of edited.
class MarkerDeletionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export const useMarkers = () => {
  const [markers, setMarkers] = useState<Marker[]>([]);

  const clearMarkers = () => {
    setMarkers([]);
  };

  const replaceMarkers = (nextMarkers: Marker[]) => {
    setMarkers(nextMarkers);
  };

  const addMarker = (x: number, y: number, photos: PhotoData[]) => {
    const newMarker: Marker = {
      id: Date.now().toString(),
      photos,
      x,
      y,
    };
    setMarkers((curr) => curr.concat(newMarker));
  };

  const editMarker = (id: string, editorFnc: (old: Marker) => Marker) => {
    setMarkers((prev) => {
      const index = prev.findIndex((m) => m.id === id);

      if (index === -1) {
        throw new RangeError(`Marker ${id} not found`);
      }

      try {
        return prev.map((marker, i) =>
          i === index ? editorFnc(marker) : marker
        );
      } catch (error) {
        if (error instanceof MarkerDeletionException) {
          return prev.filter((_, i) => i !== index);
        }
        throw error;
      }
    });
  };

  // editMarker handles deletion because it already finds the information needed to make a deletion. DRY!
  const deleteMarker = (id: string) => {
    editMarker(id, (_) => {
      throw new MarkerDeletionException("Deletion requested.");
    });
  };

  const addPhotos = (id: string, photos: PhotoData[]) => {
    editMarker(id, (old) => {
      const old_len = photos.length;
      photos = photos.filter(
        // We only want to add photos with URIs we can't find in the list already.
        (x) =>
          old.photos.findIndex((y) => {
            return x.photoUri === y.photoUri;
          }) === -1
      );
      const new_len = photos.length; // REVIEW: Prevent selection of already present photos or just report an error here?
      console.log(
        `Adding ${photos.length} photos to marker. ${old_len - new_len} photos were already present.`
      );
      return { ...old, photos: old.photos.concat(photos) }; // Deconstruct old marker and override photos with concatenated field
    });
  };

  const removePhoto = (id: string, photo: PhotoData) => {
    editMarker(id, (old) => {
      const index = old.photos.indexOf(photo);
      if (index === -1) {
        throw new RangeError(
          `${photo} not found in photos list of marker ${id} when deletion was attempted.`
        );
      } else if (old.photos.length < 2) {
        throw new MarkerDeletionException("Last photo deleted.");
      }

      return {
        ...old,
        photos: old.photos.filter((_, i) => i !== index),
      };
    });
  };

  const tryGetMarker = (x: number, y: number, scale: number = 1) => {
    const TOLERANCE = 30;
    let closestMarker = null;
    let minDistance = Infinity;
    markers.forEach((m) => {
      // Compute Manhattan distance from given point and replace closestMarker if distance is smaller
      const distance = Math.abs(m.x - x) + Math.abs(m.y - y);
      if (distance < TOLERANCE / scale && distance < minDistance) {
        closestMarker = m;
        minDistance = distance;
      }
    });
    return closestMarker;
  };

  return {
    markers,
    replaceMarkers,
    addMarker,
    deleteMarker,
    clearMarkers,
    editMarker,
    addPhotos,
    removePhoto,
    tryGetMarker,
  };
};
