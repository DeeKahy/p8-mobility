import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';

import PhotoFormModal from '../../components/photoForm';
import PhotoList from '../../components/photos_list';
import { PhotoForm } from '../models/PhotoFormModel';

interface Marker {
  id: string;
  x: number;
  y: number;
  photos: string[];
}
export default function HomeScreen() {
  const [floorPlan, setFloorPlan] = useState<string | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [newMarkerPosition, setNewMarkerPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [photoData, setPhotoData] = useState<any>();
  const [listOfPhotos, setListOfPhotos] = useState<PhotoForm[]>([]);
  const [showPhotoModule, setShowPhotoModule] = useState<boolean>(false);
  const [showPhotoList, setShowPhotoList] = useState<boolean>(false);
  const [takenWithCamera, setTakenWithCamera] = useState<boolean>(false);
  const [showMarkerOptions, setShowMarkerOptions] = useState(false);
  const [showNewMarkerOptions, setShowNewMarkerOptions] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const newMarkerPositionRef = useRef<{ x: number; y: number } | null>(null);
  const selectedMarkerRef = useRef<Marker | null>(null);

  //_________Updates when new meta data is introduced__________________
  useEffect(() => {
    if (!takenWithCamera) {
      if (!photoData) return;

      const dateTime = photoData?.assets?.[0]?.exif?.DateTimeOriginal;
      console.log(dateTime);
      console.log(JSON.stringify(photoData?.assets?.[0]?.exif, null, 2));
      const photoUri = photoData?.assets?.[0]?.uri;
      console.log(photoUri);
    }

    if (takenWithCamera) {
      const dateTime = photoData?.exif?.DateTimeOriginal;
      console.log(dateTime);
      console.log(photoData);
      const photoUri = photoData?.uri;
      console.log(photoUri);
    }
  }, [photoData]);

  //______________________________________________________

  // Keep refs in sync with state
  newMarkerPositionRef.current = newMarkerPosition;
  selectedMarkerRef.current = selectedMarker;

  const pickFloorPlan = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setFloorPlan(result.assets[0].uri);
      setMarkers([]); // Clear markers when new floor plan is selected
    }
  };

  const handleCanvasPress = (event: any) => {
    if (!floorPlan) return;

    const { locationX, locationY } = event.nativeEvent;

    // Check if tapped on existing marker (within 30px radius)
    const existingMarker = markers.find(
      (m) => Math.abs(m.x - locationX) < 30 && Math.abs(m.y - locationY) < 30
    );

    if (existingMarker) {
      setSelectedMarker(existingMarker);
      setShowMarkerOptions(true);
    } else {
      // Create new marker position
      setNewMarkerPosition({ x: locationX, y: locationY });
    }
  };

  const handleTakePictureForNewMarker = async () => {
    setShowNewMarkerOptions(false);
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    setShowCamera(true);
  };

  const addPhotoToMarker = (photoUri: string) => {
    const position = newMarkerPositionRef.current;
    const marker = selectedMarkerRef.current;

    if (position) {
      // Creating new marker with first photo
      const newMarker: Marker = {
        id: Date.now().toString(),
        x: position.x,
        y: position.y,
        photos: [photoUri],
      };
      setMarkers((prev) => [...prev, newMarker]);
      setNewMarkerPosition(null);
    } else if (marker) {
      // Adding photo to existing marker
      setMarkers((prev) =>
        prev.map((m) =>
          m.id === marker.id ? { ...m, photos: [...m.photos, photoUri] } : m
        )
      );
      setSelectedMarker({ ...marker, photos: [...marker.photos, photoUri] });
    }
  };

  const handlePickFromLibraryForNewMarker = async () => {
    setShowNewMarkerOptions(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      //__________Allowing meta data________
      exif: true,
      //_______________________________________________
    });

    if (!result.canceled) {
      setTakenWithCamera(false);
      setPhotoData(result);

      //Example usage of inserting into metadata. A better option could be to add more fields to the photo form.
      insertDataIntoImage('String', 'String');

      setShowPhotoModule(true);
    }
  };

  /**
   * Inserts data into an image object. It is dependent on if the photo is taken with camera or from library.
   * The reason for this is due to the fact that the object exif (meta data) is further indented when taking from library and we need to acess further in.
   *
   * @param {any} data - The data to insert
   * @param {string} objectName - The name of the image object
   */
  const insertDataIntoImage = async (data: any, objectName: string) => {
    if (!takenWithCamera) {
      setPhotoData((prev: any) => ({
        ...prev,
        assets: [
          {
            ...prev.assets[0],
            exif: {
              ...(prev.assets[0].exif ?? {}),
              [objectName]: data,
            },
          },
        ],
      }));
    } else if (takenWithCamera) {
      setPhotoData((prev: any) => ({
        ...prev,
        exif: {
          ...(prev.exif ?? {}),
          objectName: data,
        },
      }));
    }
  };
  //____________________________________________________________

  const handlePickFromLibraryForExistingMarker = async () => {
    setShowMarkerOptions(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      addPhotoToMarker(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      //__________Allowing meta data for taken photos________
      const photo = await cameraRef.current.takePictureAsync({ exif: true });
      //________________________________________________________________
      if (photo) {
        setPhotoData(photo);
        setTakenWithCamera(true);
        setShowCamera(false);

        setShowPhotoModule(true);
      }
    }
  };

  const handleDeletePhoto = (photoIndex: number) => {
    if (selectedMarker) {
      const updatedPhotos = selectedMarker.photos.filter(
        (_, i) => i !== photoIndex
      );
      if (updatedPhotos.length === 0) {
        // Remove marker if no photos left
        setMarkers(markers.filter((m) => m.id !== selectedMarker.id));
        setSelectedMarker(null);
        setShowPhotos(false);
      } else {
        setMarkers(
          markers.map((m) =>
            m.id === selectedMarker.id ? { ...m, photos: updatedPhotos } : m
          )
        );
        setSelectedMarker({ ...selectedMarker, photos: updatedPhotos });
      }
    }
  };

  const handleTakeAnotherPicture = async () => {
    setShowMarkerOptions(false);
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    setShowCamera(true);
  };

  const handleShowPhotos = () => {
    setShowMarkerOptions(false);
    setShowPhotos(true);
  };

  const closeAllModals = () => {
    setNewMarkerPosition(null);
    setSelectedMarker(null);
    setShowCamera(false);
    setShowPhotos(false);
    setShowMarkerOptions(false);
    setShowNewMarkerOptions(false);
  };
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef}>
          <View style={styles.cameraButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleTakePhoto}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <View style={{ width: 70 }} />
          </View>
        </CameraView>
      </View>
    );
  }

  // Show floor plan picker if no floor plan selected
  if (!floorPlan) {
    return (
      <View style={styles.pickerContainer}>
        <StatusBar style="auto" />
        <Text style={styles.title}>Floor Plan Marker</Text>
        <Text style={styles.subtitle}>
          Select a floor plan image to get started
        </Text>
        <TouchableOpacity style={styles.pickButton} onPress={pickFloorPlan}>
          <Text style={styles.pickButtonText}>Select Floor Plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* Header with change floor plan option */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Floor Plan</Text>
        <TouchableOpacity onPress={pickFloorPlan}>
          <Text style={styles.headerButton}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Floor plan with markers */}
      <Pressable style={styles.canvas} onPress={handleCanvasPress}>
        <Image
          source={{ uri: floorPlan }}
          style={styles.floorPlanImage}
          resizeMode="contain"
        />

        {/* Render markers */}
        {markers.map((marker) => (
          <View
            key={marker.id}
            style={[styles.marker, { left: marker.x, top: marker.y }]}
          >
            <View style={styles.markerDot} />
            <Text style={styles.markerCount}>{marker.photos.length}</Text>
          </View>
        ))}

        {/* New marker popup */}
        {newMarkerPosition && (
          <View
            style={[
              styles.popup,
              {
                left: newMarkerPosition.x - 82,
                top: newMarkerPosition.y - 120,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => setShowNewMarkerOptions(true)}
            >
              <Text style={styles.popupText}>Add picture for this space?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.popupCancel}
              onPress={() => setNewMarkerPosition(null)}
            >
              <Text style={styles.popupCancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.popupArrow} />
          </View>
        )}
      </Pressable>
      {/* New marker options modal */}
      <Modal visible={showNewMarkerOptions} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowNewMarkerOptions(false)}
        >
          <Pressable
            style={styles.optionsModal}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.optionsTitle}>Add Picture</Text>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleTakePictureForNewMarker}
            >
              <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handlePickFromLibraryForNewMarker}
            >
              <Text style={styles.optionText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionCancelButton}
              onPress={() => setShowNewMarkerOptions(false)}
            >
              <Text style={styles.optionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Marker options modal */}
      <Modal visible={showMarkerOptions} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={closeAllModals}>
          <Pressable
            style={styles.optionsModal}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.optionsTitle}>Marker Options</Text>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleShowPhotos}
            >
              <Text style={styles.optionText}>
                Show Pictures ({selectedMarker?.photos.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleTakeAnotherPicture}
            >
              <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handlePickFromLibraryForExistingMarker}
            >
              <Text style={styles.optionText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionCancelButton}
              onPress={closeAllModals}
            >
              <Text style={styles.optionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <PhotoFormModal
        visible={showPhotoModule}
        photoUri={
          takenWithCamera ? photoData?.uri : photoData?.assets?.[0]?.uri
        }
        dateTaken={
          takenWithCamera
            ? photoData?.exif?.DateTimeOriginal
            : photoData?.assets?.[0]?.exif?.DateTimeOriginal
        }
        onClose={() => setShowPhotoModule(false)}
        onSubmit={(data) => {
          console.log('Form data: ' + JSON.stringify(data));
          addPhotoToMarker(data.photoUri);
          setShowPhotoModule(false);
          if (data && !listOfPhotos.includes(data)) {
            setListOfPhotos((current) => [...current, data]);
            console.log('Processing photo...' + JSON.stringify(data));
          }
        }}
      />

      {/* Photos gallery modal */}
      <Modal visible={showPhotos} transparent animationType="slide">
        <View style={styles.photosModal}>
          <View style={styles.photosHeader}>
            <Text style={styles.photosTitle}>
              Photos ({selectedMarker?.photos.length})
            </Text>
            <TouchableOpacity onPress={closeAllModals}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.photosGrid}>
            {selectedMarker?.photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photoThumbnail} />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(index)}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
      {showPhotoList && (
        <View style={styles.fullscreenOverlay}>
          <PhotoList photoList={listOfPhotos} />
        </View>
      )}
      <TouchableOpacity
        style={styles.showListButton}
        onPress={() => {
          setShowPhotoList(!showPhotoList);
        }}
      >
        <Text>Show List</Text>
      </TouchableOpacity>
      <Text style={styles.instructions}>
        Tap on the floor plan to place a marker
      </Text>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  fullscreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 5,
  },

  showListButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 10,
    zIndex: 10,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  pickButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  pickButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerButton: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  canvas: {
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
  floorPlanImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  marker: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF5722',
    borderWidth: 3,
    borderColor: '#fff',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    pointerEvents: 'none',
  },
  markerCount: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#2196F3',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 18,
    overflow: 'hidden',
  },
  popup: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  popupButton: {
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginBottom: 8,
  },
  popupText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
  },
  popupCancel: {
    padding: 8,
  },
  popupCancelText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
  },
  popupArrow: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: 280,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  optionText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
  optionCancelButton: {
    padding: 15,
  },
  optionCancelText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 15,
  },
  photosModal: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  photosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  photoContainer: {
    width: (width - 40) / 3,
    height: (width - 40) / 3,
    margin: 5,
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,0,0,0.8)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  instructions: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: 8,
  },
});
