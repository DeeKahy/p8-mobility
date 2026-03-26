import { useIsFocused } from '@react-navigation/native';
import { ViroARSceneNavigator } from '@viro-community/react-viro';
import React, { useState } from 'react';
import { Touchable, TouchableOpacity, View, Text } from 'react-native';

import MeasureScene from '../../components/MeasureScene';

export default function ARView() {
  const isFocused = useIsFocused();
  const [isMeasuring, setIsMeasuring] = useState(true);

  // Prevent AR renderer from running when the tab is not active
  if (!isFocused) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <ViroARSceneNavigator
        autofocus
        initialScene={{  scene: MeasureScene, passProps: {isMeasuring}} as any}
        hdrEnabled={false}
        pbrEnabled={false}
        bloomEnabled={false}
        shadowsEnabled={false}
        multisamplingEnabled={false}
        videoQuality="Low"
        style={{ flex: 1 }}
      />
      <View>
        <TouchableOpacity
          onPress={() => {
            setIsMeasuring((prev) => !prev)
          }}
        >
          <Text style={{color: 'black', fontSize: 18}}>{isMeasuring ? 'Stop Measuring' : 'Resume Measuring'}</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}
