export type PhotoData = {
  photoUri: string;
  // Base64 payload kept with the server record so the app can render photos directly.
  photoBase64?: string;
  // Preserved so the app can build a correct data URI MIME type.
  photoFileExtension?: string;
  dateTaken: string;
  pictureName: string;
  areaGroup: string;
  description: string;
};
