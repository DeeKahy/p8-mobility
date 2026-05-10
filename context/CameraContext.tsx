import React, {
  createContext,
  Dispatch,
  RefObject,
  SetStateAction,
  useContext,
  useRef,
  useState,
} from "react";

export enum CameraMode {
  // Shorthands for comparison. Must be convertible to and from strings.
  None = "None", // No mode selected. Do nothing.
  Placement = "Placement", // No marker associated with the image. Use placement system.
  Addition = "Addition", // Marker associated with image. Don't use placement system.
}

interface CameraContextReturn {
  capturedImage: string; // URI of the most recent image captured
  setCapturedImage: Dispatch<SetStateAction<string>>;
  captureMode: RefObject<CameraMode>; // What to do with the capturedImage
}

const CameraContext = createContext<CameraContextReturn | undefined>(undefined);

export const CameraContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [capturedImage, setCapturedImage] = useState("");
  const captureMode = useRef(CameraMode.None);

  return (
    <CameraContext.Provider
      value={{ capturedImage, setCapturedImage, captureMode }}
    >
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
