import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Marker, useMarkers } from "../hooks/useMarkers";
import { useLogger } from "../context/LoggerContext";
import { TapGestureEvent } from "react-native-zoom-toolkit";

interface FloorplanContextReturn {
  floorplan: string | null;
  pickFloorplan: () => Promise<void>;
  handleCanvasPress: (event: TapGestureEvent) => void;
  markers: Marker[];
  addMarker: (x: number, y: number, photoURIs: string[]) => void;
  clearMarkers: () => void;
  editMarker: (id: string, editorFnc: (old: Marker) => Marker) => void;
  addPhotos: (id: string, photoURIs: string[]) => void;
  removePhoto: (id: string, photoURI: string) => void;
  tryGetMarker: (x: number, y: number) => (Marker | null);
  deleteMarker: (id: string) => void;
  selectedMarker: Marker | null;
  setSelectedMarker: (marker: Marker | null) => void;
  tempMarker: TempMarker | null;
  setTempMarker: Dispatch<SetStateAction<TempMarker>>;
  showTempMarker: boolean;
  setShowTempMarker: Dispatch<SetStateAction<boolean>>;
}

interface TempMarker {
  x: number;
  y: number;
}

const FloorplanContext = createContext<FloorplanContextReturn | undefined>(undefined);

export const FloorplanProvider = ({ children }: { children: React.ReactNode }) => {
  const [floorplan, setFloorplan] = useState<string | null>(null);
  const marker = useMarkers();
  const { debug } = useLogger();

  const [showMarkerOptions, setShowMarkerOptions] = useState(false);

  const [tempMarker, setTempMarker] = useState<TempMarker>({ x: 0, y: 0 });
  const [showTempMarker, setShowTempMarker] = useState(false);

  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);

  const handleCanvasPress = (event: TapGestureEvent) => {
    if (!floorplan) {
      debug("No Floorplan");
      return;
    }

    const { x, y } = event;
    const existingMarker = marker.tryGetMarker(x, y);

    if (existingMarker) {
      setSelectedMarker(existingMarker);
      setShowMarkerOptions(true);
      setShowTempMarker(false);
      debug(`Trying to select existing Marker near (${x},${y})`);
    } else {
      // Create new marker position
      setTempMarker({ x, y });
      setShowTempMarker(true);
      debug(`Trying to set temp Marker at (${x},${y})`);
    }
  };

  const pickFloorplan = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setFloorplan(result.assets[0].uri);
      marker.clearMarkers(); // Clear markers when new floor plan is selected
    }
  };

  return <FloorplanContext.Provider
    value={{
      ...marker,
      floorplan,
      pickFloorplan,
      handleCanvasPress,
      selectedMarker,
      setSelectedMarker,
      tempMarker,
      setTempMarker,
      showTempMarker,
      setShowTempMarker,
    }}>{children}</FloorplanContext.Provider>;
};

export const useFloorplan = () => {
  const context = useContext(FloorplanContext);
  if (context === undefined) {
    throw new Error("useFloorplan must be used within a FloorplanProvider");
  }
  return context;
};
