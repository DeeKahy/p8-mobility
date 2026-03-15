import {CameraView, useCameraPermissions} from 'expo-camera';
import React, {useRef} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

interface CameraUIProps {
  onPictureTaken: ((uri: string) => void) | undefined;
  onCancel?: () => void;
  cameraRef: React.RefObject<CameraView | null>;
}

export const CameraUI = async (props: CameraUIProps) => {
  const {onPictureTaken, onCancel} = props;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const handleTakePicture = async () => {
    if (!cameraRef.current) return null;
    const res = await cameraRef.current.takePictureAsync();

    if (onPictureTaken) onPictureTaken(res.uri);
  }

  if (!permission) {
    await requestPermission();
  }

  return (
   <View style={styles.cameraContainer}>
     <CameraView style={styles.camera} ref={cameraRef}>
       <View style={styles.cameraButtons}>
         <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
           <Text style={styles.buttonText}>Cancel</Text>
         </TouchableOpacity>
         <TouchableOpacity
          style={styles.captureButton}
          onPress={handleTakePicture}
         >
           <View style={styles.captureButtonInner}/>
         </TouchableOpacity>
         <View style={{width: 70}}/>
       </View>
     </CameraView>
   </View>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cameraButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  cancelButton: {
    padding: 15,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
