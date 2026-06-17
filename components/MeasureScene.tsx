import {
  ViroARHitTestResult,
  ViroARScene,
  ViroBox,
  ViroMaterials,
  ViroNode,
  ViroPolyline,
  ViroText,
  ViroTrackingReason,
  ViroTrackingState,
} from "@reactvision/react-viro";
import React, { useMemo, useRef } from "react";
import { StyleSheet } from "react-native";

import { useAR } from "../context/ARContext";
import { useOverlays } from "../context/Overlays";
import { Point3D } from "../models/3Dpoints";
import { ACCEPTED_HIT_TYPES } from "../models/ArCoreAcceptedTypes";
import { distance3D, formatDistanceCm, isValidPoint } from "../utils/arMath";
//type Point3D = [number, number, number];

const MAX_HIT_DISTANCE = 50;
const MAX_FAILED_ATTEMPTS = 75;
const BOX_SIZE = 0.025;
const TEXT_SIZE = 0.2;
const LINE_THICKNESS = BOX_SIZE / 4;

// Define materials for the markers (red + green)
ViroMaterials.createMaterials({
  pointMarker: { diffuseColor: "#ff0303", lightingModel: "Constant" },
  pointMarkerPreview: { diffuseColor: "#ff030340", lightingModel: "Constant" },
  secondPointMarker: { diffuseColor: "#03ff03", lightingModel: "Constant" },
});

const styles = StyleSheet.create({
  distanceLabel: {
    fontFamily: "Roboto",
    fontSize: 56,
    color: "#ffffff",
    textAlign: "center",
    textAlignVertical: "center",
  },
});

// Extracts the first valid hit position from AR hit test results
function extractHitPosition(
  results: ViroARHitTestResult[],
  cameraPosition?: Point3D
): Point3D | null {
  for (const result of results) {
    const position = result.transform.position;
    if (
      cameraPosition &&
      distance3D(position, cameraPosition) > MAX_HIT_DISTANCE
    )
      return null; // results are sorted by increasing distance so the next result will also be too far
    if (!ACCEPTED_HIT_TYPES.has(result.type)) continue;
    if (isValidPoint(position)) return position;
  }
  return null;
}

//Measuring distance formula (Euclidean distance)
// function calculateDistanceMeters(points: [Point3D, Point3D]) {
//   const [p1, p2] = points;
//   const dx = p2[0] - p1[0];
//   const dy = p2[1] - p1[1];
//   const dz = p2[2] - p1[2];
//   return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
// }

// function formatDistanceCm(distanceMeters: number) {
//   return `${(distanceMeters * 100).toFixed(2)} cm`;
// }

export default function MeasureScene() {
  const { showToast } = useOverlays();
  const { points, nextPoint, setNextPoint } = useAR();
  const arSceneRef = useRef<ViroARScene>(null);
  const hitTestAttempts = useRef(0);

  const distanceLabel = useMemo(() => {
    if (points.length < 2) return "";

    const last = points[points.length - 1];
    const prev = points[points.length - 2];

    const distanceMeters = distance3D(prev, last);
    return formatDistanceCm(distanceMeters);
  }, [points]);

  return (
    <ViroARScene
      ref={arSceneRef}
      onCameraARHitTest={({ hitTestResults, cameraOrientation }) => {
        if (hitTestResults.length) {
          const hitPosition = extractHitPosition(
            hitTestResults,
            cameraOrientation.position
          );
          if (hitPosition) {
            hitTestAttempts.current = 0;
            setNextPoint(hitPosition);
            return;
          }
        }
        // At a certain number of failed attempts in a row, show a toast to help troubleshoot.
        // Possibly affected by framerate but shouldn't freeze the app like setTimeout inexplicably does.
        if (++hitTestAttempts.current === MAX_FAILED_ATTEMPTS) {
          showToast(
            "Make sure the space is well-lit and don't move too close or too far away.",
            "Info",
            "Poor tracking?"
          );
        }
      }}
      onTrackingUpdated={(
        state: ViroTrackingState,
        reason: ViroTrackingReason
      ) => {
        console.log(`Tracking state set to ${state} for reason: ${reason}`);
      }}
    >
      {/* Keeping all content inside the same node ensures they stay aligned*/}
      <ViroNode position={[0, 0, 0]}>
        {points.map((p, index) => (
          <ViroBox
            key={index}
            position={p}
            materials={["pointMarker"]}
            scale={[BOX_SIZE, BOX_SIZE, BOX_SIZE]}
          />
        ))}
        {points.length > 1 ? ( // Preview of the current room shape
          <ViroPolyline
            position={[0, 0, 0]}
            points={points}
            thickness={LINE_THICKNESS}
            materials={["pointMarker"]}
          />
        ) : null}
        {points.length && nextPoint ? ( // Preview of the line to the next point
          <ViroPolyline
            position={[0, 0, 0]}
            points={[points[points.length - 1], nextPoint]}
            thickness={LINE_THICKNESS}
            materials={["pointMarkerPreview"]}
          />
        ) : null}
        {points.length > 1 ? ( // Preview of what the closed shape looks like
          <ViroPolyline
            position={[0, 0, 0]}
            points={
              nextPoint
                ? [nextPoint, points[0]]
                : [points[points.length - 1], points[0]]
            }
            thickness={LINE_THICKNESS}
            materials={["pointMarkerPreview"]}
          />
        ) : null}
        {nextPoint ? ( // Preview of where the next point will be
          <ViroBox
            position={nextPoint}
            materials={["pointMarkerPreview"]}
            scale={[BOX_SIZE, BOX_SIZE, BOX_SIZE]}
          />
        ) : null}
        <ViroText
          text={distanceLabel}
          position={points[points.length - 1]}
          scale={[TEXT_SIZE, TEXT_SIZE, TEXT_SIZE]}
          style={styles.distanceLabel}
          transformBehaviors={["billboard"]}
          visible={points.length >= 2}
        />
      </ViroNode>
    </ViroARScene>
  );
}
