import { shareAsync } from 'expo-sharing';
import { useRef } from 'react';
import { Modal, TouchableOpacity, View, Text } from 'react-native';
import Svg, { Polygon, Text as SvgText, G } from 'react-native-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';

import { RotationControls } from './RotationControls';
import { useRotation } from '../app/hooks/useRotation';
import { PointProps } from '../app/models/PointProps';
import { calculateDistanceMeters, calculateMidPoint } from '../utils/arMath';

// Type to ensure that component CreateSvg only takes type of string
type CreateSvgProps = {
  inputString: string;
};

export default function SvgComponent({
  pointList,
  visible,
  onClose,
  onDelete,
}: PointProps) {
  const { rotation, startRotating, stopRotating } = useRotation();
  const viewShotRef = useRef(null);

  /*Issue with smaller polygons not being visible on screen and too large can overtake screen, so we want to take min and max and give it to viewbox.
  Viewbox has  viewBox="x y maxHeight maxWidth".
  */
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

  //Take the captured points and turn them into string format of "x1,y1 x2,y2 ...xn,yn", because Polygon points={} needs points string in that format.
  function turnPointsToString(): string {
    let output = '';
    for (const point of pointList) {
      output += `${point[0]},${point[2]} `;
    }
    return output;
  }

  //So we can save the file in our own filesystem.
  //captureRef simply take a screenshot of the view. Could not make it work with SVG
  async function savePng() {
    const uri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
    await shareAsync(uri, { mimeType: 'image/png' });
  }

  const CreateSvg = ({ inputString }: CreateSvgProps) => (
    <Svg
      height="100%"
      width="100%"
      viewBox={`${minX - padding} ${minZ - padding} ${maxX - minX + padding * 2} ${maxZ - minZ + padding * 2}`}
    >
      {/* The element is a container used to group other SVG elements. Transformations applied to the g element are performed on all of its child elements. 
        So when we rotate, everything rotates with.
      */}
      <G
        transform={`rotate(${rotation}, ${(minX + maxX) / 2}, ${(minZ + maxZ) / 2})`}
      >
        <Polygon
          points={inputString}
          stroke="black"
          strokeWidth={stroke}
          fill="white"
        />
        {/* Sets distance between points on each edge between points and sets in the middle of the edge*/}
        {pointList.map((point, index) => {
          //To get next point, we dont start at 0, but at index 1 and then end at 0. This also ensures we don't go out of bounds.
          const next = pointList[(index + 1) % pointList.length];
          const dist = calculateDistanceMeters([point, next]);
          const mid = calculateMidPoint(point, next, offset);
          const angle =
            Math.atan2(next[2] - point[2], next[0] - point[0]) *
            (180 / Math.PI);
          return (
            <SvgText
              key={index} //Unique length to render, so if we have 4 points we get 4 different lengths
              //Position of text
              x={mid.x}
              y={mid.z / 1.3}
              fontSize={fontSize}
              fill="black"
              //Rotates the text to aline with the edge line instead of passing through the lines
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
        {/* This is the what the generated of the floor plan is*/}
        <ViewShot
          ref={viewShotRef}
          style={{ flex: 1 }}
          options={{ format: 'png', quality: 1 }}
        >
          <CreateSvg inputString={turnPointsToString()} />
        </ViewShot>

        {/* Buttons for what to do for the floorplan */}
        <RotationControls
          rotation={rotation}
          startRotating={startRotating}
          stopRotating={stopRotating}
        />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingVertical: 20,
            marginBottom: 30,
          }}
        >
          <TouchableOpacity onPress={onDelete}>
            <Text style={{ fontSize: 16 }}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={savePng}>
            <Text style={{ fontSize: 16 }}>Save floorplan</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
