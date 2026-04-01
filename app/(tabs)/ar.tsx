import { useIsFocused } from '@react-navigation/native';
import { ViroARSceneNavigator } from '@viro-community/react-viro';
import React, { useRef, useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';

import MeasureScene from '../../components/MeasureScene';
import Floorplan from '../../components/FloorplanCreation';
import { Point3D } from '../models/3Dpoints';

export default function ARView() {
  const isFocused = useIsFocused();
  const [isMeasuring, setIsMeasuring] = useState(true);
  const pointsRef = useRef<Point3D[]>([]);

  if (!isFocused) {
    return null;
  }

  const handleStop = () => {
    setIsMeasuring(false);
    console.log('Final Points:', pointsRef.current);
    console.log('Area:', pointsRef.current);
  };

  const handlePointsUpdate = (newPoints: Point3D[]) => {
    pointsRef.current = newPoints;
  };

  return (
    <View style={{ flex: 1 }}>
      <ViroARSceneNavigator
        autofocus
        initialScene={
          {
            scene: MeasureScene,
            passProps: {
              isMeasuring,
              onPointAdded: handlePointsUpdate,
            },
          } as any
        }
        hdrEnabled={false}
        pbrEnabled={false}
        bloomEnabled={false}
        shadowsEnabled={false}
        multisamplingEnabled={false}
        videoQuality="Low"
        style={{ flex: 1 }}
      />

      <View>
        <TouchableOpacity onPress={handleStop}>
          <Text style={{ color: 'black', fontSize: 18 }}>
            {isMeasuring ? 'Stop Measuring' : 'Resume Measuring'}
          </Text>
        </TouchableOpacity>
      </View>
      {!isMeasuring && (
        <Floorplan
          pointList={pointsRef.current}
          visible={!isMeasuring}
          onClose={() => {
            setIsMeasuring(true);
          }}
          onDelete={() => {
            setIsMeasuring(true);
          }}
        />
      )}
    </View>
  );
}
