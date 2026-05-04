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

const CameraContext = createContext<
    | {
        // Returned types go here:
        capturedImage: string; // URI of the most recent image captured
        setCapturedImage: Dispatch<SetStateAction<string>>;
        captureMode: CameraMode; // What to do with the capturedImage
        setCaptureMode: Dispatch<SetStateAction<CameraMode>>;
    }
    | undefined
>(undefined);

export const CameraContextProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [capturedImage, setCapturedImage] = useState("");
    const [captureMode, setCaptureMode] = useState(CameraMode.None);

    return (
        <CameraContext.Provider
            value={{ capturedImage, setCapturedImage, captureMode, setCaptureMode }}
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
