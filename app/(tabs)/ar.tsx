import { useIsFocused } from '@react-navigation/native';
import { ViroARSceneNavigator } from '@viro-community/react-viro';
import React from 'react';
import { View } from 'react-native';

import MeasureScene from '../../components/MeasureScene';

export default function ARView() {
  const isFocused = useIsFocused();

  // Prevent AR renderer from running when the tab is not active
  if (!isFocused) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <ViroARSceneNavigator
        autofocus
        initialScene={{ scene: MeasureScene }}
        hdrEnabled={false}
        pbrEnabled={false}
        bloomEnabled={false}
        shadowsEnabled={false}
        multisamplingEnabled={false}
        videoQuality="Low"
        style={{ flex: 1 }}
      />
    </View>
  );
}
