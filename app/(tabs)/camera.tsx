import { CameraView, useCameraPermissions } from 'expo-camera';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useLogger } from '../../context/LoggerContext';
export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { custom, error, log } = useLogger();
  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission is required</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <CameraView style={{ flex: 1 }} onCameraReady={() => log('Camera ready')}>
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Camera screen</Text>
      </View>
    </CameraView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 16,
  },
});
