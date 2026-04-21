import { useIsFocused } from "@react-navigation/native";
import {
  isARSupportedOnDevice,
  ViroARSceneNavigator,
} from "@reactvision/react-viro";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";

import Floorplan from "../../components/FloorplanCreation";
import MeasureScene from "../../components/MeasureScene";
import { useLogger } from "../../context/LoggerContext";
import { Point3D } from "../../models/3Dpoints";

export default function ARView() {
  const [isMeasuring, setIsMeasuring] = useState(true);
  const pointsRef = useRef<Point3D[]>([]);
  const isFocused = useIsFocused();
  const { custom } = useLogger();
  const [status, setStatus] = useState<
    "checking" | "supported" | "unsupported"
  >("checking");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    custom(`AR focus: ${isFocused}`, "camera");
  }, [isFocused]);

  useEffect(() => {
    let cancelled = false;

    async function checkARSupport() {
      try {
        setStatus("checking");
        setErrorMessage("");
        const result = await isARSupportedOnDevice();
        if (cancelled) return;

        if (result?.isARSupported) {
          setStatus("supported");
        } else {
          setStatus("unsupported");
        }
      } catch (error) {
        if (cancelled) return;
        setStatus("unsupported");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "AR is not available on this device."
        );
      }
    }

    if (isFocused) {
      checkARSupport();
    }

    return () => {
      cancelled = true;
    };
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

  if (status === "checking") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.title}>Checking AR support...</Text>
      </View>
    );
  }

  if (status === "unsupported") {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>AR is not available yet</Text>
        <Text style={styles.body}>
          Google Play Services for AR (ARCore) is required for this screen.
        </Text>
        <Text style={styles.body}>
          Install/update ARCore, then return here.
          {errorMessage ? `\n\nDetails: ${errorMessage}` : ""}
        </Text>
        <Pressable
          style={styles.button}
          onPress={() =>
            Linking.openURL(
              "https://play.google.com/store/apps/details?id=com.google.ar.core"
            )
          }
        >
          <Text style={styles.buttonText}>Open ARCore page</Text>
        </Pressable>
      </View>
    );
  }

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
      {isMeasuring && (
        <View style={styles.crosshairContainer} pointerEvents="none">
          <View style={styles.crosshairHorizontal} />
          <View style={styles.crosshairVertical} />
        </View>
      )}

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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#444",
  },
  crosshairContainer: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  crosshairHorizontal: {
    position: "absolute",
    width: 30,
    height: 2,
    backgroundColor: "white",
  },
  crosshairVertical: {
    position: "absolute",
    width: 2,
    height: 30,
    backgroundColor: "white",
  },
});
