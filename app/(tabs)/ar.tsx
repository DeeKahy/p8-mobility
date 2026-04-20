import { useIsFocused } from "@react-navigation/native";
import { ViroARSceneNavigator } from "@reactvision/react-viro";
import React, { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";

import Floorplan from "../../components/FloorplanCreation";
import MeasureScene from "../../components/MeasureScene";
import { useLogger } from "../../context/LoggerContext";
import { Point3D } from "../../models/3Dpoints";

export default function ARView() {
  const [isMeasuring, setIsMeasuring] = useState(true);
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

      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={handleStop}
          style={[
            styles.button,
            isMeasuring ? styles.buttonStop : styles.buttonResume,
          ]}
        >
          <Text style={styles.buttonText}>
            {isMeasuring ? "Stop Measuring" : "Resume Measuring"}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  arView: {
    flex: 1,
  },
  buttonRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    padding: 14,
    paddingBottom: 28,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonStop: {
    backgroundColor: "#e63946",
  },
  buttonResume: {
    backgroundColor: "#2a9d8f",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
});
