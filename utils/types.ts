import { PhotoData } from "../models/PhotoFormModel";

export interface ApiErrorResponse {
  error: string;
}

export interface FloorplanImage {
  id: string;
  imageUri: string;
  imageName: string;
  createdAt: string;
  // Base64 payload kept with the server record so the app can render images directly.
  imageBase64?: string;
  // Preserved so the app can build a correct data URI MIME type.
  imageFileExtension?: string;
}

export interface FloorplanImageRecord {
  floorplans: FloorplanImage[];
}

export interface FloorplanListProps {
  floorplans: FloorplanImage[];
  isLoading: boolean;
  pickFloorPlan: (storedFloorplan: FloorplanImage) => void | Promise<void>;
  onDeleteFloorPlan: (storedFloorplan: FloorplanImage) => Promise<void> | void;
}

export interface FloorplanCardProps {
  storedFloorplan: FloorplanImage;
  pickFloorPlan: (storedFloorplan: FloorplanImage) => void | Promise<void>;
  onDeleteFloorPlan: (storedFloorplan: FloorplanImage) => Promise<void> | void;
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
