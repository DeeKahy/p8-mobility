import { Directory, File, Paths } from "expo-file-system";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import Svg, { G, Polygon, Text as SvgText } from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";

import { RotationControls } from "./RotationControls";
import { SaveFormModal } from "./SaveModal";
import { useRotation } from "../app/hooks/useRotation";
import { PointProps } from "../models/PointProps";
import { calculateDistanceMeters, calculateMidPoint } from "../utils/arMath";

// Type to ensure that component CreateSvg only takes type of string
type CreateSvgProps = {
  inputString: string;
};

export default function SvgComponent({
  pointList,
  visible,
  onClose,
  onDelete,
}: PointProps) {
  const { rotation, startRotating, stopRotating } = useRotation();
  const viewShotRef = useRef(null);
  const [name, setName] = useState<string>("");
  const router = useRouter();
  const [showSaveModal, setShowSaveModal] = useState(false);

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
      //Creates a path for a new directory in the local storage
      const imagesDirectory = new Directory(Paths.document, "floorplan-images");
      //Checks if the directory already exists
      if (!imagesDirectory.exists) {
        imagesDirectory.create();
      }

      const capturedUri = await captureRef(viewShotRef, {
        format: "png",
        quality: 1,
      });

      console.log("capturedUri:", capturedUri);
      const outputUri = imagesDirectory.uri + `/floorplan-${Date.now()}.png`;
      const destFile = new File(outputUri);
      const sourceFile = new File(capturedUri);
      sourceFile.copy(destFile);
    } catch (error) {
      throw new Error("Couldn't save picture to list" + error);
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
