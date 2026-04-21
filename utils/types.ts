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
