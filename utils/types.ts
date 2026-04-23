import { PhotoData } from "../models/PhotoFormModel";

export interface ApiErrorResponse {
  error: string;
}

export interface FloorplanFileListResponse {
  files: string[];
}

export interface FloorplanImage {
  id: string;
  imageUri: string;
  imageName: string;
  createdAt: string;
  // Server-backed fallback used to recreate the local floorplan image.
  imageBase64?: string;
  // Preserved so restored floorplan files keep a usable extension.
  imageFileExtension?: string;
}

export interface FloorplanImageRecord {
  floorplans: FloorplanImage[];
}

export interface FloorplanMarker {
  id: string;
  x: number;
  y: number;
  photos: PhotoData[];
}

export interface FloorplanMarkerCollection {
  floorplanId: string;
  markers: FloorplanMarker[];
}

export interface FloorplanMarkerCollectionRecord {
  collections: FloorplanMarkerCollection[];
}
