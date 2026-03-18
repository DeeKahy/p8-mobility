import {
  ViroARScene,
  ViroBox,
  ViroMaterials,
  ViroText,
} from '@viro-community/react-viro';
import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, PixelRatio, StyleSheet } from 'react-native';

type Point3D = [number, number, number];

const HIDDEN_POINT: Point3D = [0, -10, 0];

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

type HitResult = {
  type: string;
  transform?: HitTransform;
};

const PLANE_HIT_TYPES = new Set([
  'ExistingPlaneUsingExtent',
  'ExistingPlane',
  'EstimatedHorizontalPlane',
  'EstimatedVerticalPlane',
  'FeaturePoint',
]);

function isValidPoint(position: unknown): position is Point3D {
  return (
    Array.isArray(position) &&
    position.length === 3 &&
    position.every(
      (value) => typeof value === 'number' && Number.isFinite(value)
    )
  );
}

function extractHitPosition(results: unknown): Point3D | null {
  if (!Array.isArray(results)) {
    return null;
  }

  for (const entry of results) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const result = entry as HitResult;
    if (!PLANE_HIT_TYPES.has(result.type)) {
      continue;
    }

    const position = result.transform?.position;
    if (isValidPoint(position)) {
      return position;
    }
  }

  return null;
}

function calculateDistanceMeters(points: [Point3D, Point3D]) {
  const [p1, p2] = points;
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
}

function formatDistanceCm(distanceMeters: number) {
  return `${(distanceMeters * 100).toFixed(2)} cm`;
}

export default function MeasureScene() {
  const [firstPoint, setFirstPoint] = useState<Point3D | null>(null);
  const [secondPoint, setSecondPoint] = useState<Point3D | null>(null);
  const arSceneRef = useRef<ViroARScene | null>(null);

  const distanceLabel = useMemo(() => {
    if (!firstPoint || !secondPoint) {
      return '';
    }

    const distanceMeters = calculateDistanceMeters([firstPoint, secondPoint]);
    return formatDistanceCm(distanceMeters);
  }, [firstPoint, secondPoint]);

  const handleSceneClick = async (tapPosition: Point3D) => {
    if (!arSceneRef.current) return;

    try {
      // Use the actual tap position first; fallback to center raycast if needed.
      let hitPosition: Point3D | null = isValidPoint(tapPosition)
        ? tapPosition
        : null;

      if (!hitPosition) {
        const centerX = (Dimensions.get('window').width * PixelRatio.get()) / 2;
        const centerY =
          (Dimensions.get('window').height * PixelRatio.get()) / 2;

        const result = await arSceneRef.current.performARHitTestWithPoint(
          centerX,
          centerY
        );
        hitPosition = extractHitPosition(result);
      }

      if (!hitPosition) {
        console.log('No surface detected at this point.');
        return;
      }

      if (!firstPoint || secondPoint) {
        setFirstPoint(hitPosition);
        setSecondPoint(null);
        return;
      }

      setSecondPoint(hitPosition);
    } catch (error) {
      console.error('Error performing hit test:', error);
    }
  };

  const handleSecondPointDrag = (dragToPos: Point3D) => {
    if (!isValidPoint(dragToPos)) {
      return;
    }

    setSecondPoint(dragToPos);
  };

  return (
    <ViroARScene ref={arSceneRef} onClick={handleSceneClick}>
      <ViroBox
        position={firstPoint ?? HIDDEN_POINT}
        materials={['pointMarker']}
        scale={[0.025, 0.025, 0.025]}
        visible={firstPoint !== null}
      />

      <ViroBox
        position={secondPoint ?? HIDDEN_POINT}
        materials={['secondPointMarker']}
        scale={[0.025, 0.025, 0.025]}
        visible={secondPoint !== null}
        dragType="FixedToWorld"
        onDrag={handleSecondPointDrag}
      />

      <ViroText
        text={distanceLabel}
        position={
          secondPoint
            ? [secondPoint[0], secondPoint[1] + 0.06, secondPoint[2]]
            : HIDDEN_POINT
        }
        scale={[0.2, 0.2, 0.2]}
        style={styles.distanceLabel}
        visible={secondPoint !== null}
      />
    </ViroARScene>
  );
}
