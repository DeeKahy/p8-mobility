export type PhotoData = {
  photoUri: string;
  // Server-backed fallback used to recreate the local file if it disappears.
  photoBase64?: string;
  // Preserved so restored files keep a usable extension.
  photoFileExtension?: string;
  dateTaken: string;
  pictureName: string;
  areaGroup: string;
  description: string;
};
