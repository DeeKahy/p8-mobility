import {
  ViroARScene,
  ViroBox,
  ViroMaterials,
} from '@viro-community/react-viro';
import React, { useRef, useState } from 'react';
import { Dimensions, PixelRatio } from 'react-native';

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

function isValidPoint(position: Point3D) {
  return (
    Array.isArray(position) &&
    position.length === 3 &&
    position.every(
      (value) => typeof value === 'number' && Number.isFinite(value)
    )
  );
}

function extractHitPosition(hitTestResults: unknown): Point3D | null {
  if (!Array.isArray(hitTestResults)) {
    return null;
  }
  for (const result of hitTestResults) {
    if (result && typeof result === 'object') {
      const transform = result.transform;
      if (transform && typeof transform === 'object') {
        return transform.position as Point3D;
      }
    }
  }
  return null;
}

function calculateDistance(points: Point3D[]) {
  const [p1, p2] = points;
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function formatDistance(distanceInMeters: number) {
  if (distanceInMeters < 1) {
    return `${Math.round(distanceInMeters * 100)} cm`;
  }
  return `${distanceInMeters.toFixed(2)} m`;
}

export default function MeasureScene() {
  const [firstPoint, setFirstPoint] = useState<Point3D | null>(null);
  const [secondPoint, setSecondPoint] = useState<Point3D | null>(null);
  const arSceneRef = useRef<ViroARScene | null>(null);

  const handleTap = async () => {
    if (!arSceneRef.current) return;

    const centerX = Dimensions.get('window').width / 2;
    const centerY = Dimensions.get('window').height / 2;
    try {
      const result = await arSceneRef.current.performARHitTestWithPoint(
        centerX,
        centerY
      );
      const hitPosition = extractHitPosition(result);
      console.log('Hit test result:', hitPosition);

      if (!hitPosition) {
        return;
      }

      console.log('Extracted hit position:', hitPosition);

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
