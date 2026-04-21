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

  const handleARError = (error: unknown) => {
    const message =
      (error as { nativeEvent?: { error?: { message?: string } } })?.nativeEvent
        ?.error?.message ||
      "AR failed to start. Please install/update ARCore and try again.";
    setStatus("unsupported");
    setErrorMessage(message);
  };

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
        onError={handleARError as any}
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

      <View>
        <TouchableOpacity onPress={handleStop}>
          <Text style={{ color: "black", fontSize: 18 }}>
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
  button: {
    marginTop: 8,
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
