import {
  ViroARScene,
  ViroBox,
  ViroMaterials,
  ViroText,
} from '@viro-community/react-viro';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  PixelRatio,
  StyleSheet,
} from 'react-native';

import { Point3D } from '../app/models/3Dpoints';
import { ACCEPTED_HIT_TYPES } from '../app/models/ArCoreAcceptedTypes';
import {
  isValidPoint,
  calculateDistanceMeters,
  formatDistanceCm,
} from '../utils/arMath';

// Used to "hide" AR objects by moving them far below the scene instead of removing them.
// This keeps components mounted, avoids null position issues, and prevents flickering.
// https://viro-community.readme.io/docs/scenes
const HIDDEN_POINT: Point3D = [0, -10, 0];

// Define materials for the markers (red + green)
ViroMaterials.createMaterials({
  pointMarker: {
    diffuseColor: '#ff0303',
    lightingModel: 'Constant',
  },
  secondPointMarker: {
    diffuseColor: '#03ff03',
    lightingModel: 'Constant',
  },
});

const styles = StyleSheet.create({
  distanceLabel: {
    fontFamily: 'Roboto',
    fontSize: 56,
    color: '#ffffff',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});

type HitTransform = {
  position: Point3D;
};

type ARHitTestResult = {
  type: string;
  transform?: {
    position?: Point3D;
    rotation?: number[];
    scale?: number[];
  };
};

type HitResult = {
  type: string;
  transform?: HitTransform;
};

// Extracts the first valid hit position from AR hit test results
function extractHitPosition(results: unknown): Point3D | null {
  if (!Array.isArray(results)) {
    return null;
  }

  for (const entry of results) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const result = entry as HitResult;
    if (!ACCEPTED_HIT_TYPES.has(result.type)) {
      continue;
    }

    const position = result.transform?.position;
    if (isValidPoint(position)) {
      return position;
    }
  }

  return null;
}

// function calulateTurf = (...arg: Point3D) => {
//   const result = area(arg);
// }

function logDistanceCm(firstPoint: Point3D, secondPoint: Point3D) {
  const distanceMeters = calculateDistanceMeters([firstPoint, secondPoint]);
  console.log('Distance:', formatDistanceCm(distanceMeters));
}

export default function MeasureScene(props: any) {
  const [points, setPoints] = useState<Point3D[]>([]);
  const { isMeasuring = true, onPointAdded } = props;
  const arSceneRef = useRef<ViroARScene | null>(null);

  const distanceLabel = useMemo(() => {
    if (points.length < 2) return '';

    const last = points[points.length - 1];
    const prev = points[points.length - 2];

    const distanceMeters = calculateDistanceMeters([prev, last]);
    return formatDistanceCm(distanceMeters);
  }, [points]);

  const handleSceneClick = async (tapPosition: Point3D) => {
    if (!isMeasuring) return;
    if (!arSceneRef.current) return;

    try {
      let hitPosition: Point3D | null = isValidPoint(tapPosition)
        ? tapPosition
        : null;

      if (!hitPosition) {
        const centerX = (Dimensions.get('window').width * PixelRatio.get()) / 2;
        const centerY =
          (Dimensions.get('window').height * PixelRatio.get()) / 2;

        const result: ARHitTestResult = await arSceneRef.current.performARHitTestWithPoint(
          centerX,
          centerY
        );
        console.log('AR hit test results:', result); // <-- log everything
        hitPosition = extractHitPosition(result);
        if (!hitPosition) {
          console.log('No valid surface detected at tap.');
        }
      }

      if (!hitPosition) return;

      setPoints((prev) => {
        const updatedPoints = [...prev, hitPosition];
        setTimeout(() => {
          onPointAdded?.(updatedPoints);
        }, 0);
        return updatedPoints;
      });
    } catch (error) {
      console.error('Error performing hit test:', error);
    }
  };

  return (
    <ViroARScene ref={arSceneRef} onClick={handleSceneClick}>
      {points.map((p, index) => (
        <ViroBox
          key={index}
          position={p}
          materials={['pointMarker']}
          scale={[0.025, 0.025, 0.025]}
        />
      ))}

      <ViroText
        text={distanceLabel}
        position={
          points.length > 0
            ? [
              points[points.length - 1][0],
              points[points.length - 1][1],
              points[points.length - 1][2],
            ]
            : HIDDEN_POINT
        }
        scale={[0.2, 0.2, 0.2]}
        style={styles.distanceLabel}
        transformBehaviors={['billboard']}
        visible={points.length >= 2}
      />
    </ViroARScene>
  );
}
