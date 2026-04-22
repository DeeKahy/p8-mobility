import { Directory, File, Paths } from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import Svg, { G, Polygon, Text as SvgText } from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";

import { RotationControls } from "../../components/RotationControls";
import { SaveFormModal } from "../../components/SaveModal";
import { useToast } from "../../context/ToastProvider";
import { Point3D } from "../../models/3Dpoints";
import { PointProps } from "../../models/PointProps";
import {
  calculateDistanceMeters,
  calculateMidPoint,
  isValidPoint,
} from "../../utils/arMath";
import useRotation from "../hooks/useRotation";

// Type to ensure that component CreateSvg only takes type of string
type CreateSvgProps = {
  inputString: string;
};

export default function SvgComponent({
  visible,
  onClose,
  onDelete,
}: PointProps) {
  const { points: rawPointList } = useLocalSearchParams<{
    points?: string | string[];
  }>();
  const router = useRouter();
  const { showToast } = useToast();

  const pointList: Point3D[] = useMemo(() => {
    const value = Array.isArray(rawPointList) ? rawPointList[0] : rawPointList;

    if (!value) return [];

    try {
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(isValidPoint);
    } catch {
      return [];
    }
  }, [rawPointList]);

  const { rotation, startRotating, stopRotating } = useRotation();
  const viewShotRef = useRef(null);
  const [name, setName] = useState<string>("");
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

      const normalizedName = name.trim() || "Unnamed Floorplan";
      //Removes spaces and special characters from the name
      const safeName = encodeURIComponent(normalizedName.replace(/\s+/g, "_"));
      const outputUri =
        imagesDirectory.uri + `/floorplan-${Date.now()}-${safeName}.png`;
      const destFile = new File(outputUri);
      const sourceFile = new File(capturedUri);
      sourceFile.copy(destFile);
    } catch (error) {
      throw new Error("Couldn't save picture to list" + error);
    }
  }

  async function handleSaveOnly() {
    await saveToList();
    setShowSaveModal(false);
    showToast(
      "Floorplan saved! You can find it under Floorplan page!",
      "Success"
    );
    router.push({
      pathname: "/",
    });
  }

  async function handleSaveAndNext() {
    await saveToList();
    setShowSaveModal(false);
    showToast("Floorplan saved!", "Success");
    router.push({
      pathname: "/ar",
    });
  }

  if (pointList.length <= 2) {
    return (
      <Modal visible={visible} onRequestClose={onClose} animationType="slide">
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No valid points found</Text>

          <Text style={styles.emptyText}>
            Your floorplan needs at least 3 valid points to generate a polygon.
            Please redo the scan.
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/ar")}
            style={styles.redoButton}
          >
            <Text style={styles.buttonText}>Redo</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
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
          // To rotate the text according to the edge, we calculate the angle of the edge and then rotate the text accordingly.
          const rawAngle =
            Math.atan2(next[2] - point[2], next[0] - point[0]) *
            (180 / Math.PI);
          const textAngle =
            rawAngle > 90 || rawAngle < -90 ? rawAngle + 180 : rawAngle;
          return (
            <SvgText
              key={index} //Unique length to render, so if we have 4 points we get 4 different lengths
              //Position of text
              x={mid.x}
              y={mid.z * 1.3}
              fontSize={fontSize}
              fill="black"
              alignmentBaseline="middle"
              // To rotate the text according to the edge.
              transform={`rotate(${textAngle}, ${mid.x}, ${mid.z})`}
            >
              {`${dist.toFixed(1)} m`}
            </SvgText>
          );
        })}
      </G>
      <View
        style={{
          top: 400,
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
      <View style={styles.container}>
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
        <View style={styles.header}>
          <Text style={styles.title}>Floorplan Preview</Text>

          <TextInput
            placeholder="Enter room name..."
            onChangeText={(newText) => setName(newText)}
            defaultValue={name}
            style={styles.input}
          />
        </View>
        <View style={styles.svgContainer}>
          <ViewShot ref={viewShotRef} style={{ flex: 1 }}>
            <CreateSvg inputString={turnPointsToString()} />
          </ViewShot>
        </View>

        {/* Buttons for what to do for the floorplan */}
        <RotationControls
          rotation={rotation}
          startRotating={startRotating}
          stopRotating={stopRotating}
        />

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => setShowSaveModal(true)}
            style={styles.saveButton}
          >
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/ar")}
            style={styles.resetButton}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },

  input: {
    height: 46,
    width: "100%",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    fontSize: 16,
    color: "#0F172A",
  },

  svgContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",

    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 50,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",

    shadowColor: "#2196F3",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  resetButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",

    shadowColor: "#2196F3",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  roomNameOverlay: {
    position: "absolute",
    top: 18,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  roomNameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    gap: 20,
    backgroundColor: "#F8FAFC",
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },

  emptyText: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
  },

  redoButton: {
    width: "100%",
    maxWidth: 260,
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",

    shadowColor: "#2196F3",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
});
