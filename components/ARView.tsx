import { ViroARSceneNavigator } from '@viro-community/react-viro';
import React from 'react';
import { View } from 'react-native';

import MeasureScene from './MeasureScene';

export default function ARView() {
  return (
    <View style={{ flex: 1 }}>
      <ViroARSceneNavigator
        autofocus
        initialScene={{ scene: MeasureScene }}
        style={{ flex: 1 }}
      />
    </View>
  );
}
