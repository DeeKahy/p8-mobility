import { File } from "expo-file-system";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import Svg, { G, Polygon, Text as SvgText } from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";

import { RotationControls } from "./RotationControls";
import { SaveFormModal } from "./SaveModal";
import { useRotation } from "../app/hooks/useRotation";
import { useFloorplan } from "../context/FloorplanContext";
import { useLogger } from "../context/LoggerContext";
import { PointProps } from "../models/PointProps";
import {
  getFloorplanImageRecord,
  saveFloorplanImageRecord,
} from "../utils/api";
import { calculateDistanceMeters, calculateMidPoint } from "../utils/arMath";
import { toImageDataUri } from "../utils/imageDataHelpers";
import { FloorplanImageRecord } from "../utils/types";

// Type to ensure that component CreateSvg only takes type of string
type CreateSvgProps = {
  inputString: string;
};

export default function SvgComponent({
  pointList,
  visible,
  onClose,
  
}: PointProps) {
  const { rotation, startRotating, stopRotating } = useRotation();
  const viewShotRef = useRef(null);
  const [name, setName] = useState<string>("");
  const router = useRouter();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const { refreshStoredFloorplans } = useFloorplan();
  const { error, log } = useLogger();

  /*Issue with smaller polygons not being visible on screen and too large can overtake screen, so we want to take min and max and give it to viewbox.
  Viewbox has  viewBox="x y maxHeight maxWidth".
  */
  const minX = Math.min(...pointList.map((p) => p[0]));
  const minZ = Math.min(...pointList.map((p) => p[2]));
  const maxX = Math.max(...pointList.map((p) => p[0]));
  const maxZ = Math.max(...pointList.map((p) => p[2]));

  // Roomsize for the padding and other stuff so the room is rendered prop
  const roomSize = Math.max(maxX - minX, maxZ - minZ);
  const padding = roomSize * 0.1;
  const fontSize = roomSize * 0.05;
  const stroke = roomSize * 0.008;
  const offset = fontSize * 0.1;

  //Take the captured points and turn them into string format of "x1,y1 x2,y2 ...xn,yn", because Polygon points={} needs points string in that format.
  function turnPointsToString(): string {
    let output = "";
    for (const point of pointList) {
      output += `${point[0]},${point[2]} `;
    }
    return output;
  }

  async function saveToList() {
    try {
      const capturedUri = await captureRef(viewShotRef, {
        format: "png",
        quality: 1,
      });

      const createdAt = new Date().toISOString();
      const nextFloorplanId = `floorplan-${Date.now()}`;
      const imageBase64 = await new File(capturedUri).base64();
      let floorplanImageRecord: FloorplanImageRecord = { floorplans: [] };

      try {
        floorplanImageRecord = await getFloorplanImageRecord();
        log("Successfully fetched floorplan image record before save");
      } catch (caughtError) {
        const errorMessage =
          caughtError instanceof Error ? caughtError.message : "Unknown error";

        if (errorMessage !== "file not found") {
          error(
            `Fetching floorplan image record before save failed: ${errorMessage}`
          );
          throw caughtError;
        }

        log("No existing floorplan image record found before save");
      }

      const nextFloorplanName =
        name.trim().length > 0 ? name.trim() : `Floorplan ${createdAt}`;

      // Save it to the server
      await saveFloorplanImageRecord({
        floorplans: floorplanImageRecord.floorplans.concat({
          id: nextFloorplanId,
          imageUri: toImageDataUri(imageBase64, "png"),
          imageName: nextFloorplanName,
          createdAt,
          imageBase64,
          imageFileExtension: "png",
        }),
      });
      log(`Successfully saved floorplan ${nextFloorplanId} to API`);

      await refreshStoredFloorplans();
      log("Successfully refreshed stored floorplans after save");
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";
      error(`Saving floorplan failed: ${errorMessage}`);
      throw new Error("Couldn't save picture to list" + caughtError);
    }
  }

  async function handleSaveOnly() {
    await saveToList();
    router.push({
      pathname: "/",
    });
    setShowSaveModal(false);
  }

  async function handleSaveAndNext() {
    await saveToList();
    setShowSaveModal(false);
  }

  const CreateSvg = ({ inputString }: CreateSvgProps) => (
    <Svg
      height="100%"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      viewBox={`${minX - padding} ${minZ - padding} ${maxX - minX + padding * 2} ${maxZ - minZ + padding * 4}`}
    >
      {/* The element is a container used to group other SVG elements. Transformations applied to the g element are performed on all of its child elements. 
        So when we rotate, everything rotates with.
      */}
      <G
        transform={`rotate(${rotation}, ${(minX + maxX) / 2}, ${(minZ + maxZ) / 2})`}
      >
        <Polygon
          points={inputString}
          stroke="black"
          strokeWidth={stroke}
          fill="white"
        />
        {/* Sets distance between points on each edge between points and sets in the middle of the edge*/}
        {pointList.map((point, index) => {
          //To get next point, we dont start at 0, but at index 1 and then end at 0. This also ensures we don't go out of bounds.
          const next = pointList[(index + 1) % pointList.length];
          const dist = calculateDistanceMeters([point, next]);
          const mid = calculateMidPoint(point, next, offset);
          const angle =
            Math.atan2(next[2] - point[2], next[0] - point[0]) *
            (180 / Math.PI);
          return (
            <SvgText
              key={index} //Unique length to render, so if we have 4 points we get 4 different lengths
              //Position of text
              x={mid.x}
              y={mid.z / 1.3}
              fontSize={fontSize}
              fill="black"
              //Rotates the text to aline with the edge line instead of passing through the lines
              transform={`rotate(${angle}, ${mid.x}, ${mid.z})`}
            >
              {`${dist.toFixed(2)}m`}
            </SvgText>
          );
        })}
      </G>
      <View
        style={{
          top: 550,
          position: "relative",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 20 }}>{name}</Text>
      </View>
    </Svg>
  );

  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <SaveFormModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={() => {
          handleSaveOnly();
        }}
        onSaveNext={() => {
          handleSaveAndNext();
        }}
      />
      <View style={{ alignItems: "center", position: "relative" }}>
        <TextInput
          placeholder="Enter room name..."
          onChangeText={(newText) => setName(newText)}
          defaultValue={name}
          style={{
            position: "relative",
            top: 40,
            height: 40,
            width: 200,
            backgroundColor: "white",
            paddingHorizontal: 10,
            borderColor: "gray",
            borderWidth: 1,
            zIndex: 1,
            fontSize: 16,
          }}
        />
      </View>
      <View style={{ flex: 1 }}>
        <ViewShot
          ref={viewShotRef}
          style={{ flex: 1 }}
          options={{ format: "png", quality: 1 }}
        >
          <CreateSvg inputString={turnPointsToString()} />
        </ViewShot>
      </View>

      {/* Buttons for what to do for the floorplan */}
      <RotationControls
        rotation={rotation}
        startRotating={startRotating}
        stopRotating={stopRotating}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 20,
          marginBottom: 30,
        }}
      >
        <TouchableOpacity onPress={() => setShowSaveModal(true)}>
          <Text style={{ fontSize: 16 }}>Save</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
