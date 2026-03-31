import { shareAsync } from 'expo-sharing';
import { useRef, useState } from 'react';
import { Modal, TouchableOpacity, View, Text } from 'react-native';
import Svg, { Polygon, Text as SvgText, G } from 'react-native-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Point3D } from '../app/models/3Dpoints';
import { calculateDistanceMeters } from '../utils/arMath';

type PointProps = {
  pointList: Point3D[];
  visible: boolean;
  onClose: () => void;
};

type CreateSvgProps = {
  inputString: string;
};

export default function SvgComponent({ pointList, visible, onClose }: PointProps) {
  const [rotation, setRotation] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* We want to find the min and max values, this is due to the fact that the svg image scales weird depending on how large the room is. 
  We want to instead make it dynamic so even if the room is small*/
  const minX = Math.min(...pointList.map((p) => p[0]));
  const minZ = Math.min(...pointList.map((p) => p[2]));
  const maxX = Math.max(...pointList.map((p) => p[0]));
  const maxZ = Math.max(...pointList.map((p) => p[2]));

  // Roomsize for the padding and other stuff so the room is rendered prop
  const roomSize = Math.max(maxX - minX, maxZ - minZ);
  const padding  = roomSize * 0.05;
  const fontSize = roomSize * 0.05;
  const stroke   = roomSize * 0.008;
  const offset   = fontSize * 0.1;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

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

  // Start spinning while finger is held down
  function startRotating(dir: 1 | -1) {
    setRotation((r) => r + dir); // immediate first tick
    intervalRef.current = setInterval(() => {
      setRotation((r) => r + dir);
    }, 100); // every 50ms = smooth but not too fast
  }

  // Stop when finger lifts
  function stopRotating() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function calculateMidPoint(pointA: Point3D, pointB: Point3D) {
    const midX = (pointA[0] + pointB[0]) / 2;
    const midZ = (pointA[2] + pointB[2]) / 2;
    const dx = pointB[0] - pointA[0];
    const dz = pointB[2] - pointA[2];
    const length = Math.sqrt(dx * dx + dz * dz);
    return {
      x: midX - (dz / length) * offset,
      z: midZ + (dx / length) * offset,
    };
  }

  const CreateSvg = ({ inputString }: CreateSvgProps) => (
    <Svg
      height="100%"
      width="100%"
      viewBox={`${minX - padding} ${minZ - padding} ${maxX - minX + padding * 2} ${maxZ - minZ + padding * 2}`}
    >
      <G transform={`rotate(${rotation}, ${cx}, ${cz})`}>
        <Polygon points={inputString} stroke="black" strokeWidth={stroke} fill="white" />
        {pointList.map((point, index) => {
          const next = pointList[(index + 1) % pointList.length];
          const dist = calculateDistanceMeters([point, next]);
          const mid  = calculateMidPoint(point, next);
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

        {/* Buttons to rotate the svg so it can match the room perspective */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 32, paddingVertical: 12 }}>
          <TouchableOpacity
            onPressIn={() => startRotating(-1)}
            onPressOut={stopRotating}
          >
            <Text style={{ fontSize: 28 }}>↺</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 14, color: '#666', width: 60, textAlign: 'center' }}>
            {`${((rotation % 360) + 360) % 360}°`}
          </Text>
          <TouchableOpacity
            onPressIn={() => startRotating(1)}
            onPressOut={stopRotating}
          >
            <Text style={{ fontSize: 28 }}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Buttons for what to do for the floorplan */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, marginBottom: 30 }}>
          <TouchableOpacity><Text style={{ fontSize: 16 }}>Reset</Text></TouchableOpacity>
          <TouchableOpacity onPress={savePng}><Text style={{ fontSize: 16 }}>Save floorplan</Text></TouchableOpacity>
          <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 16 }}>Cancel</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}