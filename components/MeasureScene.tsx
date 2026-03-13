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

  }
})
/*
ViroMaterials.createMaterials({
  pointMarker: {
    diffuseColor: '#FFB703',
    lightingModel: 'Constant',
  },
  secondPointMarker: {
    diffuseColor: '#00B4D8',
    lightingModel: 'Constant',
  },
});

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

function calculateDistance(firstPoint: Point3D, secondPoint: Point3D) {
  const deltaX = secondPoint[0] - firstPoint[0];
  const deltaZ = secondPoint[2] - firstPoint[2];

  return Math.sqrt(deltaX ** 2 + deltaZ ** 2);
}

function formatDistance(distanceInMeters: number) {
  if (distanceInMeters < 1) {
    return `${(distanceInMeters * 100).toFixed(1)} cm`;
  }

  return `${distanceInMeters.toFixed(2)} m`;
}

export default function MeasureScene() {
  const [firstPoint, setFirstPoint] = useState<Point3D | null>(null);
  const [secondPoint, setSecondPoint] = useState<Point3D | null>(null);
  const arSceneRef = useRef<ViroARScene | null>(null);

  const handleSceneClick = async () => {
    if (!arSceneRef.current) {
      return;
    }

    const centerX = (Dimensions.get('window').width * PixelRatio.get()) / 2;
    const centerY = (Dimensions.get('window').height * PixelRatio.get()) / 2;

    try {
      const results = await arSceneRef.current.performARHitTestWithPoint(
        centerX,
        centerY
      );
      const hitPosition = extractHitPosition(results);

      console.log('hitTestResults', results);

      if (!hitPosition) {
        return;
      }

      console.log('hitPosition', hitPosition);

      if (!firstPoint || secondPoint) {
        setFirstPoint(hitPosition);
        setSecondPoint(null);
        return;
      }

      console.log(
        'distance',
        formatDistance(calculateDistance(firstPoint, hitPosition))
      );
      setSecondPoint(hitPosition);
    } catch (error) {
      console.log('hitTestError', error);
    }
  };

  return (
    <ViroARScene ref={arSceneRef} onClick={handleSceneClick}>
      <ViroBox
        materials={['pointMarker']}
        position={firstPoint ?? HIDDEN_POINT}
        scale={[0.025, 0.025, 0.025]}
        visible={firstPoint !== null}
      />
      <ViroBox
        materials={['secondPointMarker']}
        position={secondPoint ?? HIDDEN_POINT}
        scale={[0.025, 0.025, 0.025]}
        visible={secondPoint !== null}
      />
    </ViroARScene>
  );
}
*/