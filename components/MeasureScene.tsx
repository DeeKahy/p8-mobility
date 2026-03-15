import {
  ViroARScene,
  ViroBox,
  ViroMaterials,
} from '@viro-community/react-viro';
import React, { useRef, useState } from 'react';
import { Dimensions } from 'react-native';

type Point3D = [number, number, number];

const HIDDEN_POINT: Point3D = [0, 0, 0];

// Materials define how AR objects look when rendered in the scene
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

// Simple check that a position is a valid 3D coordinate
function isValidPoint(position: Point3D) {
  return (
    Array.isArray(position) &&
    position.length === 3 &&
    position.every(
      (value) => typeof value === 'number' && Number.isFinite(value)
    )
  );
}

// Extracts the world position from a Viro AR hit test result
// Hit tests cast a ray from the screen into the AR world to find surfaces
function extractHitPosition(results: unknown): Point3D | null {
  if (!Array.isArray(results)) {
    return null;
  }

  for (const result of results) {
    if (
      result &&
      typeof result === 'object' &&
      'type' in result &&
      'transform' in result &&
      result.type === 'ExistingPlaneUsingExtent'
    ) {
      const transform = result.transform;

      if (
        transform &&
        typeof transform === 'object' &&
        'position' in transform &&
        isValidPoint(transform.position)
      ) {
        return transform.position;
      }
    }
  }

  return null;
}

// Calculates distance between two 3D points in AR space
function calculateDistance(points: Point3D[]) {
  const [p1, p2] = points;
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
}

// Formats meters into cm or meters for display
function formatDistance(distanceInMeters: number) {
  if (distanceInMeters < 1) {
    return `${Math.round(distanceInMeters * 100)} cm`;
  }
  return `${distanceInMeters.toFixed(2)} m`;
}

export default function MeasureScene() {
  const [firstPoint, setFirstPoint] = useState<Point3D | null>(null);
  const [secondPoint, setSecondPoint] = useState<Point3D | null>(null);

  // Ref lets us call Viro AR scene methods like hit testing
  const arSceneRef = useRef<ViroARScene | null>(null);

  const handleTap = async () => {
    if (!arSceneRef.current) return;

    // Use the center of the screen for the AR hit test
    const centerX = Dimensions.get('window').width / 2;
    const centerY = Dimensions.get('window').height / 2;
    try {
      // Cast a ray into the AR world to detect a real-world surface
      const result = await arSceneRef.current.performARHitTestWithPoint(
        centerX,
        centerY
      );
      const hitPosition = extractHitPosition(result);
      console.log('Hit test result:', hitPosition);
      if (!hitPosition) {
        console.log('No surface detected at this point.');
        return;
      }

      console.log('Extracted hit position:', hitPosition);

      // First tap places the first point, second tap places the second point
      if (!firstPoint || secondPoint) {
        setFirstPoint(hitPosition);
        setSecondPoint(null);
        return;
      }
      console.log(
        'distance: ',
        formatDistance(calculateDistance([firstPoint, hitPosition]))
      );
      setSecondPoint(hitPosition);
    } catch (error) {
      console.error('Error performing hit test:', error);
    }
  };
  return (
    // ViroARScene is the root container for AR objects
    <ViroARScene ref={arSceneRef} onClick={handleTap}>
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
      />
    </ViroARScene>
  );
}
