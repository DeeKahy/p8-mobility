import { createContext, useState } from "react";
import { GestureResponderEvent } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMarkers } from "../hooks/useMarkers";

interface FloorplanContext {
	floorplanURI: string;
	pickFloorplan: () => Promise<void>;
	handleCanvasPress: (event: GestureResponderEvent) => void;
}

interface TempMarker {
	x: number;
	y: number;
}

const FloorplanContext = createContext<FloorplanContext | undefined>(undefined);

export const FloorProvider = ({ children }: { children: React.ReactNode }) => {
	const [floorPlan, setFloorPlan] = useState<string | null>(null);
	const { markers, tryGetMarker } = useMarkers();

	const [showMarkerOptions, setShowMarkerOptions] = useState(false);

	const [tempMarkers, setTempMarkers] = useState<TempMarker>({ x: 0, y: 0 });
	const [showTempMarker, setShowTempMarker] = useState(false);

	const handleCanvasPress = (event: any) => {
		if (!floorPlan) return;

		const { locationX, locationY } = event.nativeEvent;

		const existingMarker = tryGetMarker(locationX, locationY);


		if (existingMarker) {
			setSelectedMarker(existingMarker);
			setShowMarkerOptions(true);
		} else {
			// Create new marker position
			setNewMarkerPosition({ x: locationX, y: locationY });
		}
	};

	const pickFloorPlan = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: false,
			quality: 1
		});

		if (!result.canceled) {
			setFloorPlan(result.assets[0].uri);
			setMarkers([]); // Clear markers when new floor plan is selected
		}
	};

	return <FloorplanContext.Provider
		value={pickFloorPlan,}>{children}</FloorplanContext.Provider>;
};
