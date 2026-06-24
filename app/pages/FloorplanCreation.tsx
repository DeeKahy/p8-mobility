import { File } from "expo-file-system";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import Svg, { G, Polygon, Text as SvgText } from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";

import LoadingOverlay from "../../components/LoadingOverlay";
import { RotationControls } from "../../components/RotationControls";
import { SaveFormModal } from "../../components/SaveModal";
import { useAR } from "../../context/ARContext";
import { useFloorplan } from "../../context/FloorplanContext";
import { useLogger } from "../../context/LoggerContext";
import { useOverlays } from "../../context/Overlays";
import { Point2D } from "../../models/3Dpoints";
import { createFloorplanImage } from "../../utils/api";
import {
  boundingBox,
  distance2D,
  lerp2D,
  rotate2D,
  to2D,
  toRadians,
} from "../../utils/arMath";
import { toImageDataUri } from "../../utils/imageDataHelpers";
import { hashNameToColor } from "../../utils/stringColor";
import useRotation from "../hooks/useRotation";

type CreateSvgProps = {
  inputPoints: Point2D[];
};

export default function SvgComponent() {
  const router = useRouter();
  const { showToast } = useOverlays();
  const { refreshStoredFloorplans } = useFloorplan();
  const { error, log } = useLogger();

  const { rotation, startRotating, stopRotating } = useRotation();
  const viewShotRef = useRef(null);
  const [name, setName] = useState<string>("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSavingFloorplan, setIsSavingFloorplan] = useState(false);
  const [pointList] = useState(useAR().points.map(to2D)); // Copy points from context on mount and make them 2D

  /*Issue with smaller polygons not being visible on screen and too large can overtake screen, so we want to take min and max and give it to viewbox.
  Viewbox has  viewBox="x y maxHeight maxWidth".
  */
  const { minX, minY, maxX, maxY } = boundingBox(pointList);
  const dX = maxX - minX;
  const dY = maxY - minY;
  const pointsCenter: Point2D = [dX / 2, dY / 2];

  // SVGs break at very small scales, so we have to scale our points' coordinates up to fit the viewBox dimensions:
  const VB_WIDTH = 200;
  const VB_HEIGHT = 250;
  const VB_PADDING = 40;

  //Take the captured points and turn them into string format of "x1,y1 x2,y2 ...xn,yn", because Polygon points={} needs points string in that format.
  function turnPointsToString(points: Point2D[]): string {
    let output = "";
    for (const point of points) {
      output += `${point[0]},${point[1]} `;
    }
    return output;
  }

  async function saveToServer() {
    try {
      setIsSavingFloorplan(true);

      const capturedUri = await captureRef(viewShotRef, {
        format: "png",
        quality: 1,
      });

      const createdAt = new Date().toISOString();
      const nextFloorplanId = `floorplan-${Date.now()}`;
      const imageBase64 = await new File(capturedUri).base64();
      const nextFloorplanName =
        name.trim().length > 0 ? name.trim() : `Floorplan ${createdAt}`;

      await createFloorplanImage({
        id: nextFloorplanId,
        imageUri: toImageDataUri(imageBase64, "png"),
        imageName: nextFloorplanName,
        createdAt,
        imageBase64,
        imageFileExtension: "png",
      });
      log(`Successfully saved floor plan ${nextFloorplanId} to server`);

      await refreshStoredFloorplans();
      log("Successfully refreshed stored floor plans after save");
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error ? caughtError.message : "Unknown error";
      error(`Saving floor plan failed: ${errorMessage}`);
      throw caughtError;
    } finally {
      setIsSavingFloorplan(false);
    }
  }

  async function handleSaveOnly() {
    try {
      await saveToServer();
      setShowSaveModal(false);
      showToast("Floor plan uploaded!", "Success");
      router.push({
        pathname: "/",
      });
    } catch {
      showToast("Floor plan upload failed. Please try again.", "Error");
    }
  }

  async function handleSaveAndNext() {
    try {
      await saveToServer();
      setShowSaveModal(false);
      showToast("Floor plan uploaded!", "Success");
      router.push({
        pathname: "/ar",
      });
    } catch {
      showToast("Floor plan upload failed. Please try again.", "Error");
    }
  }

  const onRedo = () => {
    router.push("/ar");
  };

  if (pointList.length <= 2) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Not enough points</Text>

        <Text style={styles.emptyText}>
          At least 3 points are needed to generate a room. Please redo the scan.
        </Text>

        <TouchableOpacity onPress={onRedo} style={styles.redoButton}>
          <Text style={styles.buttonText}>Redo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const CreateSvg = ({ inputPoints }: CreateSvgProps) => {
    // Rotate the points before drawing the SVG so we can determine if extra scaling is needed to keep everything in view
    const rotatedPoints = rotate2D(
      inputPoints,
      pointsCenter,
      toRadians(rotation)
    );

    const { minX, minY, maxX, maxY } = boundingBox(rotatedPoints);
    const dX = maxX - minX;
    const dY = maxY - minY;
    // Compute scaling factors and select the minimum to preserve aspect ratio:
    const scale = Math.min(VB_WIDTH / dX, VB_HEIGHT / dY);
    // Compute offsets to center the content:
    const centeringOffsetX = (VB_WIDTH - dX * scale) / 2 + VB_PADDING * 0.5;
    const centeringOffsetY = (VB_HEIGHT - dY * scale) / 2 + VB_PADDING * 0.5;
    // Define function to scale the points accordingly and apply the offsets:
    const transform = (p: Point2D): Point2D => [
      centeringOffsetX + (p[0] - minX) * scale,
      centeringOffsetY + (p[1] - minY) * scale,
    ];

    const points = rotatedPoints.map(transform);

    return (
      <Svg
        height="100%"
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VB_WIDTH + VB_PADDING} ${VB_HEIGHT + VB_PADDING}`}
      >
        {/* The G element is a container used to group other SVG elements. Transformations applied to the G element are performed on all of its child elements. 
        So when we rotate, everything rotates with.
      */}
        <G>
          <Polygon
            points={turnPointsToString(points)}
            stroke="#505050" // Edges are grey instead of black so overlapping text is legible.
            strokeWidth={1}
            fill={hashNameToColor(name) + "50"} // Name color becomes semitransparent by adding "50"
          />
          {/* Sets distance between points on each edge between points and sets in the middle of the edge*/}
          {points.map((point, index) => {
            //To get next point, we dont start at 0, but at index 1 and then end at 0. This also ensures we don't go out of bounds.
            const next = points[(index + 1) % points.length];
            const dist = distance2D(point, next) / scale; // Scale the distance back down, don't forget!
            const mid = lerp2D(point, next, 0.5);
            return (
              <G
                key={index} //Unique length to render, so if we have 4 points we get 4 different lengths
              >
                <SvgText
                  x={mid[0]}
                  y={mid[1]}
                  fill="black"
                  fontSize={12}
                  transform={`rotate(${0}, ${mid[0]}, ${mid[1]})`}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {`${dist.toFixed(2)}m`}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    );
  };

  return (
    <View style={styles.container}>
      {isSavingFloorplan ? (
        <LoadingOverlay text="Uploading floor plan..." />
      ) : null}
      {showSaveModal ? (
        <SaveFormModal
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveOnly}
          onSaveNext={handleSaveAndNext}
        />
      ) : null}
      <View style={styles.header}>
        <Text style={styles.title}>Preview</Text>

        <TextInput
          placeholder="Enter name..."
          onChangeText={(newText) => setName(newText)}
          defaultValue={name}
          style={styles.input}
        />
      </View>
      <View style={styles.svgContainer}>
        <ViewShot ref={viewShotRef} style={{ flex: 1 }}>
          <CreateSvg inputPoints={pointList} />
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
          disabled={isSavingFloorplan}
          style={styles.saveButton}
        >
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onRedo} style={styles.resetButton}>
          <Text style={styles.buttonText}>Redo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
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
    ...StyleSheet.absoluteFillObject,
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
