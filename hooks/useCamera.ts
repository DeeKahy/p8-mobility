import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';

export const useCamera = () => {
  const cameraRef = useRef<CameraView>(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const showCamera = () => setIsCameraVisible(true);
  const hideCamera = () => setIsCameraVisible(false);

  const takePhoto = useRef(async () => {
      if (!permission) {
        const res = await requestPermission();
        if (res.granted && cameraRef.current)
          return await cameraRef.current.takePictureAsync();
      }
      return null; // Return null if permission was denied, or the process was abandoned
    },
  );

  const pickPhotoFromLibrary = useRef(async (selectionLimit = 1) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      selectionLimit,
      allowsEditing: false,
      quality: 1,
    });
    if (res.canceled) return null;
    return res.assets;
  });

  return {
    cameraRef,
    showCamera,
    hideCamera,
    isCameraVisible,
    takePhoto: takePhoto.current,
    pickPhotoFromLibrary: pickPhotoFromLibrary.current,
  };
};
