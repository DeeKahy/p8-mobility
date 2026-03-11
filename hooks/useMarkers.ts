import { useState } from 'react';

export interface Marker {
  id: string;
  x: number;
  y: number;
  photos: string[];
}

export const useMarkers = () => {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);

  const clearMarkers = () => {
    setMarkers([]);
  };

  const addMarker = (x: number, y: number, photoURI: string) => {
    const newMarker: Marker = {
      id: Date.now().toString(),
      photos: [photoURI],
      x,
      y,
    };
    setMarkers((curr) => curr.concat(newMarker));
  };

  const editMarker = (id: string, editorFnc: (old: Marker) => Marker) => {
    const index = markers.findIndex((m) => m.id === id);
    markers[index] = editorFnc(markers[index]); // Set the index of the entry with matching ID to the output of the editor function
    setMarkers(markers);
  };

  const addPhoto = (id: string, photoURI: string) => {
    editMarker(id, (old) => {
      return { ...old, photos: old.photos.concat(photoURI) }; // Deconstruct old marker and override photos with concatenated field
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
    clearMarkers,
    editMarker,
    addPhoto,
    tryGetMarker,
  };
};
