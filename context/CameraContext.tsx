import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";

export enum CameraMode {
  // Shorthands for comparison. Must be convertible to and from strings.
  None = "None", // No mode selected. Do nothing.
  Placement = "Placement", // No marker associated with the image. Use placement system.
  Addition = "Addition", // Marker associated with image. Don't use placement system.
}

type imageCaptureData = { uri: string; mode: CameraMode };

const CameraContext = createContext<
  | {
      // Returned types go here:
      capturedImage: imageCaptureData;
      setCapturedImage: Dispatch<SetStateAction<imageCaptureData>>;
    }
  | undefined
>(undefined);

export const CameraContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [capturedImage, setCapturedImage] = useState<imageCaptureData>({
    uri: "", // URI of the most recent image captured
    mode: CameraMode.None,
  });
  return (
    <CameraContext.Provider value={{ capturedImage, setCapturedImage }}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = () => {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error("useCamera must be used within a CameraContextProvider");
  }
  return context;
};
