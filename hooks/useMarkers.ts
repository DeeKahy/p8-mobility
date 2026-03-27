import { useState } from "react";

export interface Marker {
  id: string;
  x: number;
  y: number;
  photos: string[];
}

export const useMarkers = () => {
  const [markers, setMarkers] = useState<Marker[]>([]);

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
    const index = markers.findIndex((m) => m.id === id);
    const temp = Array.from(markers);
    temp[index] = editorFnc(temp[index]); // Set the index of the entry with matching ID to the output of the editor function
    setMarkers(temp);
  };

  const deleteMarker = (id: string) => {
    const index = markers.findIndex((m) => m.id === id);
    if (index != -1) {
      markers.splice(index, 1);
      //setMarkers(markers);
    }
    // REVIEW: Throw if an id is invalid?
  };

  const addPhotos = (id: string, photoURIs: string[]) => {
    editMarker(id, (old) => {
      photoURIs = photoURIs.filter(   // We only want to add photos we can't find in the list already.
        (x) => old.photos.indexOf(x) == -1,
      );  // REVIEW: Throw if a photo is already present or just fail silently?
      return { ...old, photos: old.photos.concat(photoURIs) }; // Deconstruct old marker and override photos with concatenated field
    });
  };

  const removePhoto = (id: string, photoURI: string) => {
    editMarker(id, (old) => {
      const index = old.photos.indexOf(photoURI);
      if (index == -1) {   // URI must exist in the photos list.
        return old;     // REVIEW: Throw if URI couldn't be found?
      } else if (old.photos.length < 2) {
        // REVIEW: Delete marker if last photo would be deleted or disallow photo deletion?
      }
      return { ...old, photos: old.photos.splice(index, 1) };
    });
  };

  const tryGetMarkerByScreenSpace = (x: number, y: number) => {
    const TOLERANCE = 30;
    let nearMarkers = markers.filter(
      (m) => Math.abs(m.x - x) + Math.abs(m.y - y) < TOLERANCE,
    ); // Check if any markers are within tolerance (Manhattan Distance)
    if (nearMarkers.length === 0) return null;

    if (nearMarkers.length === 1) return nearMarkers[0];
    nearMarkers = nearMarkers.sort((a, b) =>
      Math.abs(a.x - x) + Math.abs(a.y - y) <
      Math.abs(b.x - x) + Math.abs(b.y - y)
        ? -1
        : 1,
    );
    return nearMarkers[0];
  };

  const getMarkersById = (id: string) => {
    const res = markers.find((m) => m.id === id);
    if (!res) return null;
    return res;
  };

  return {
    markers,
    addMarker,
    addPhotos,
    editMarker,
    removePhoto,
    clearMarkers,
    deleteMarker,
    getMarkersById,
    tryGetMarkerByScreenSpace,
  };
};
