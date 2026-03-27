import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { GestureResponderEvent } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Marker, useMarkers } from "../hooks/useMarkers";
import { useLogger } from "../context/LoggerContext";

interface FloorplanContextReturn {
  floorplan: string | null;
  pickFloorplan: () => Promise<void>;
  handleCanvasPress: (event: GestureResponderEvent) => void;
  markers: Marker[];
  addMarker: (x: number, y: number, photoURIs: string[]) => void;
  clearMarkers: () => void;
  editMarker: (id: string, editorFnc: (old: Marker) => Marker) => void;
  addPhotos: (id: string, photoURIs: string[]) => void;
  removePhoto: (id: string, photoURI: string) => void;
  tryGetMarker: (x: number, y: number) => Marker | null;
  deleteMarker: (id: string) => void;
  selectedMarkerId: string | null;
  setSelectedMarkerId: Dispatch<SetStateAction<string | null>>;
  tempMarker: TempMarker | null;
  setTempMarker: Dispatch<SetStateAction<TempMarker>>;
  showTempMarker: boolean;
  setShowTempMarker: Dispatch<SetStateAction<boolean>>;
  showMarkerOptions: boolean;
  setShowMarkerOptions: Dispatch<SetStateAction<boolean>>;
  selectedMarker: Marker | undefined;
}

interface TempMarker {
  x: number;
  y: number;
}

const FloorplanContext = createContext<FloorplanContextReturn | undefined>(
  undefined
);

export const FloorplanProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [floorplan, setFloorplan] = useState<string | null>(null);
  const marker = useMarkers();
  const { debug } = useLogger();

  const [showMarkerOptions, setShowMarkerOptions] = useState(false);

  const [tempMarker, setTempMarker] = useState<TempMarker>({ x: 0, y: 0 });
  const [showTempMarker, setShowTempMarker] = useState(false);

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const handleCanvasPress = (event: GestureResponderEvent) => {
    if (!floorplan) {
      debug("No Floorplan");
      return;
    }

    const { locationX, locationY } = event.nativeEvent;
    const existingMarker = marker.tryGetMarker(locationX, locationY);

    if (existingMarker) {
      setSelectedMarkerId(existingMarker.id);
      setShowMarkerOptions(true);
      setShowTempMarker(false);
      debug("Trying to select existing Marker");
    } else {
      // Create new marker position
      setTempMarker({ x: locationX, y: locationY });
      setShowTempMarker(true);
      debug("Trying to set temp Marker");
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

  return (
    <FloorplanContext.Provider
      value={{
        ...marker,
        floorplan,
        pickFloorplan,
        handleCanvasPress,
        selectedMarker: selectedMarkerId
          ? marker.markers.find((m) => m.id == selectedMarkerId)
          : undefined,
        selectedMarkerId,
        setSelectedMarkerId,
        tempMarker,
        setTempMarker,
        showTempMarker,
        setShowTempMarker,
        showMarkerOptions,
        setShowMarkerOptions,
      }}
    >
      {children}
    </FloorplanContext.Provider>
  );
};

export const useFloorplan = () => {
  const context = useContext(FloorplanContext);
  if (context === undefined) {
    throw new Error("useFloorplan must be used within a FloorplanProvider");
  }
  return context;
};
