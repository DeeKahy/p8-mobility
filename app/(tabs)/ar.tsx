import { useIsFocused } from "@react-navigation/native";
import {
  isARSupportedOnDevice,
  ViroARSceneNavigator,
} from "@reactvision/react-viro";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";

import MeasureScene from "../../components/MeasureScene";
import { useAR } from "../../context/ARContext";
import { useLogger } from "../../context/LoggerContext";
import { styles as indexStyles } from "../../css/indexStyle";

export default function ARView() {
  const { points, setPoints, nextPoint, setNextPoint } = useAR();
  const isFocused = useIsFocused();
  const { custom } = useLogger();
  const [status, setStatus] = useState<
    "checking" | "supported" | "unsupported"
  >("checking");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  // Reset points when the AR tab enters focus
  useFocusEffect(
    useCallback(() => {
      setPoints([]);
      setNextPoint(null);
    }, [])
  );

  useEffect(() => {
    custom(`AR focus: ${isFocused}`, "AR");
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
  // FIXME: Changing tabs rapidly causes java.lang.NullPointerException and/or freezes the app!
  // Theory: Since ARCore startup is async it's trying to contact ViroARSceneNavigator after the latter has unmounted!
  if (!isFocused) {
    return null;
  }

  const handleStop = () => {
    router.push({
      pathname: "pages/FloorplanCreation",
      params: {
        points: JSON.stringify(points),
      },
    });
  };

  const handleAdd = () => {
    if (nextPoint) {
      console.log("nextPoint exists. Adding to points");
      setPoints((prev) => [...prev, nextPoint]);
      setNextPoint(null);
    } else {
      console.log("nextPoint is null");
    }
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
      {nextPoint ? (
        <View style={styles.crosshairContainer} pointerEvents="none">
          <View style={styles.crosshairHorizontal} />
          <View style={styles.crosshairVertical} />
        </View>
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: "center", justifyContent: "center" },
          ]}
          pointerEvents="none"
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={indexStyles.popupText}>Finding reference points...</Text>
          <Text
            style={[
              indexStyles.popupCancelText,
              { color: indexStyles.popupText.color },
            ]}
          >
            Move the camera around to help map out the space
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={handleStop}
          style={[
            styles.button,
            points.length > 2 ? styles.buttonResume : styles.buttonStop,
          ]}
        >
          <Text style={styles.buttonText}>
            {points.length > 2 ? "Finish" : `Finish (${points.length}/3)`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.button, styles.buttonResume]}
        >
          <Text style={styles.buttonText}>Add point</Text>
        </TouchableOpacity>
      </View>
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
