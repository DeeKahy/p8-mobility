import { shareAsync } from 'expo-sharing';
import { useRef } from 'react';
import { Modal, TouchableOpacity, View, Text } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';

import { styles } from '../app/css/floorplancreator';
import { Point3D } from '../app/models/3Dpoints';

type PointProps = {
  pointList: Point3D[];
  visible: boolean;
  onClose: () => void;
};

type CreateSvgProps = {
  inputString: string;
};

export default function SvgComponent({
  pointList,
  visible,
  onClose,
}: PointProps) {
  const minX = Math.min(...pointList.map((p) => p[0]));
  const minZ = Math.min(...pointList.map((p) => p[2]));
  const maxX = Math.max(...pointList.map((p) => p[0]));
  const maxZ = Math.max(...pointList.map((p) => p[2]));

  function turnPointsToString(): string {
    let output = '';
    for (const point of pointList) {
      output += `${point[0]},${point[2]} `;
    }
    return output;
  }

  //Needs comments
  // Add a ref
  const viewShotRef = useRef(null);

  // Replace saveSvg with this
  async function savePng() {
    const uri = await captureRef(viewShotRef, {
      format: 'png',
      quality: 1,
    });
    await shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Save your floorplan',
    });
  }

  const CreateSvg = ({ inputString }: CreateSvgProps) => (
    <View>
      <Svg
        height="50%"
        width="50%"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`${minX} ${minZ} ${maxX - minX} ${maxZ - minZ}`}
        style={styles.svgContainer}
      >
        <Polygon
          points={inputString}
          stroke="black"
          strokeWidth="0.02"
          fill="white"
        />
      </Svg>
    </View>
  );

  return (
    <Modal visible={visible}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <CreateSvg inputString={turnPointsToString()} />
      </ViewShot>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={savePng}>
          <Text style={styles.buttonText}>Save floorplan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
