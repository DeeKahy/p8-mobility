import { useIsFocused } from "@react-navigation/native";
import { ViroARSceneNavigator } from "@reactvision/react-viro";
import React, { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import Floorplan from "../../components/FloorplanCreation";
import MeasureScene from "../../components/MeasureScene";
import { useLogger } from "../../context/LoggerContext";
import { Point3D } from "../../models/3Dpoints";

export default function ARView() {
  const [isMeasuring, setIsMeasuring] = useState(true);
  const [resetArPoints, setResetArPoints] = useState<number>(0);
  const [points, setPoints] = useState<Point3D[]>([]);
  const pointsRef = useRef<Point3D[]>([]);
  const isFocused = useIsFocused();
  const { custom } = useLogger();
  useEffect(() => {
    custom(`AR focus: ${isFocused}`, "camera");
  }, [isFocused]);
  // Prevent AR renderer from running when the tab is not active
  if (!isFocused) {
    return null;
  }

  const handleStop = () => {
    setIsMeasuring(false);
    console.log("Final Points:", pointsRef.current);
    console.log("Area:", pointsRef.current);
  };

  const handlePointsUpdate = (newPoints: Point3D[]) => {
    setPoints(newPoints)
  };

  return (
    <View style={{ flex: 1 }}>
      <ViroARSceneNavigator
        key={resetArPoints}
        autofocus
        initialScene={
          {
            scene: MeasureScene,
            passProps: {
              isMeasuring,
              points,
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
        <TouchableOpacity onPress={handleStop} disabled={points.length < 3}>
          <Text style={{ color: "black", fontSize: 18 }}>
            {isMeasuring ? "Stop Measuring" : "Resume Measuring"}
          </Text>
        </TouchableOpacity>
      </View>
      <View>
        <TouchableOpacity onPress={() => setPoints((points) => points.slice(0, -1))} disabled={points.length === 0}>
          <Text style={{ color: "black", fontSize: 18 }}>
            Undo last point
          </Text>
        </TouchableOpacity>
      </View>
      {!isMeasuring && (
        <Floorplan
          pointList={points}
          visible={!isMeasuring}
          onClose={() => {
            setIsMeasuring(true);
          }}
          onReset={() => {
            setPoints([]);
            setResetArPoints((i) => i + 1);
            setIsMeasuring(true);
          }}
        />
      )}
    </View>
  );
}
