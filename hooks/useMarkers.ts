import { useState } from "react";

import { useLogger } from "../context/LoggerContext";

export interface Marker {
  id: string;
  x: number;
  y: number;
  photos: string[];
}

// Throw this error when you want the affected marker to be deleted by editMarker instead of edited.
class MarkerDeletionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export const useMarkers = () => {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const { debug } = useLogger();

  const clearMarkers = () => {
    setMarkers([]);
  };

  const addMarker = (x: number, y: number, photoURIs: string[]) => {
    const newMarker: Marker = {
      id: Date.now().toString(),
      photos: photoURIs,
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

  const addPhotos = (id: string, photoURIs: string[]) => {
    editMarker(id, (old) => {
      const old_len = photoURIs.length;
      photoURIs = photoURIs.filter(
        // We only want to add photos we can't find in the list already.
        (x) => old.photos.indexOf(x) === -1
      );
      const new_len = photoURIs.length; // REVIEW: Prevent selection of already present photos or just report an error here?
      debug(
        `Adding ${photoURIs.length} photos to marker. ${old_len - new_len} photos were already present.`
      );
      return { ...old, photos: old.photos.concat(photoURIs) }; // Deconstruct old marker and override photos with concatenated field
    });
  };

  const removePhoto = (id: string, photoURI: string) => {
    editMarker(id, (old) => {
      const index = old.photos.indexOf(photoURI);
      if (index === -1) {
        throw new RangeError(
          `${photoURI} not found in photos list of marker ${id} when deletion was attempted.`
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

  const tryGetMarker = (x: number, y: number) => {
    const TOLERANCE = 30;
    let nearMarkers = markers.filter(
      (m) => Math.abs(m.x - x) + Math.abs(m.y - y) < TOLERANCE
    ); // Check if any markers are within tolerance (Manhattan Distance)
    if (nearMarkers.length === 0) return null;

    if (nearMarkers.length === 1) return nearMarkers[0];
    nearMarkers = nearMarkers.sort((a, b) =>
      Math.abs(a.x - x) + Math.abs(a.y - y) <
      Math.abs(b.x - x) + Math.abs(b.y - y)
        ? -1
        : 1
    );
    return nearMarkers[0];
  };

  return {
    markers,
    addMarker,
    deleteMarker,
    clearMarkers,
    editMarker,
    addPhotos,
    removePhoto,
    tryGetMarker,
  };
};
