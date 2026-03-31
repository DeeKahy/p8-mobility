import { shareAsync } from 'expo-sharing';
import { useRef, useState } from 'react';
import { Modal, TouchableOpacity, View, Text } from 'react-native';
import Svg, { Polygon, Text as SvgText, G } from 'react-native-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { PointProps } from '../app/models/PointProps';
import { calculateDistanceMeters, calculateMidPoint } from '../utils/arMath';
import { useRotation } from "../app/hooks/useRotation";
import { RotationControls } from "./RotationControls";


type CreateSvgProps = {
  inputString: string;
};

export default function SvgComponent({ pointList, visible, onClose }: PointProps) {
  const { rotation, startRotating, stopRotating } = useRotation();
  const minX = Math.min(...pointList.map((p) => p[0]));
  const minZ = Math.min(...pointList.map((p) => p[2]));
  const maxX = Math.max(...pointList.map((p) => p[0]));
  const maxZ = Math.max(...pointList.map((p) => p[2]));

  // Roomsize for the padding and other stuff so the room is rendered prop
  const roomSize = Math.max(maxX - minX, maxZ - minZ);
  const padding = roomSize * 0.1;
  const fontSize = roomSize * 0.05;
  const stroke = roomSize * 0.008;
  const offset = fontSize * 0.1;

  function turnPointsToString(): string {
    let output = '';
    for (const point of pointList) {
      output += `${point[0]},${point[2]} `;
    }
    return output;  
  }

  const viewShotRef = useRef(null);

  async function savePng() {
    const uri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
    await shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Save your floorplan' });
  }

  const CreateSvg = ({ inputString }: CreateSvgProps) => (
    <Svg
      height="100%"
      width="100%"
      viewBox={`${minX - padding} ${minZ - padding} ${maxX - minX + padding * 2} ${maxZ - minZ + padding * 2}`}
    >
      <G transform={`rotate(${rotation}, ${(minX + maxX) / 2}, ${(minZ + maxZ) / 2})`}>
        <Polygon points={inputString} stroke="black" strokeWidth={stroke} fill="white" />
        {pointList.map((point, index) => {
          const next = pointList[(index + 1) % pointList.length];
          const dist = calculateDistanceMeters([point, next]);
          const mid  = calculateMidPoint(point, next, offset);
          const angle = Math.atan2(next[2] - point[2], next[0] - point[0]) * (180 / Math.PI);
          return (
            <SvgText
              key={index}
              x={mid.x}
              y={mid.z}
              fontSize={fontSize}
              fill="black"
              textAnchor="middle"
              alignmentBaseline="middle"
              transform={`rotate(${angle}, ${mid.x}, ${mid.z})`}
            >
              {`${dist.toFixed(2)}m`}
            </SvgText>
          );
        })}
      </G>
    </Svg>
  );

  return (
    <Modal visible={visible}>
      <View style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 16 }}>
        {/* This is the what the generated of the floor plan is*/ }
        <ViewShot ref={viewShotRef} style={{ flex: 1 }} options={{ format: 'png', quality: 1 }}>
          <CreateSvg inputString={turnPointsToString()} />
        </ViewShot>

        {/* Buttons for what to do for the floorplan */}
        <RotationControls
          rotation={rotation}
          startRotating={startRotating}
          stopRotating={stopRotating}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, marginBottom: 30 }}>
          <TouchableOpacity><Text style={{ fontSize: 16 }}>Reset</Text></TouchableOpacity>
          <TouchableOpacity onPress={savePng}><Text style={{ fontSize: 16 }}>Save floorplan</Text></TouchableOpacity>
          <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 16 }}>Cancel</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}