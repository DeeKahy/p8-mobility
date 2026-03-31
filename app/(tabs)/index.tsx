import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonZoomState, ResumableZoom } from 'react-native-zoom-toolkit';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFloorplan } from '../../context/FloorplanContext';
import { CameraUI } from '../../components/CameraUI';
import * as ImagePicker from 'expo-image-picker';
import { CameraView } from 'expo-camera';
import { EditMarkerModal } from '../../components/index/EditMarkerModal';

export default function HomeScreen() {
  const [newMarkerPosition, setNewMarkerPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const {
    markers,
    floorplan,
    selectedMarker,
    pickFloorplan,
    handleCanvasPress,
    addPhotos,
    removePhoto,
    addMarker,
    tempMarker,
    showTempMarker,
    setSelectedMarker,
    setShowTempMarker,
  } = useFloorplan();

  const [showPhotos, setShowPhotos] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showNewMarkerOptions, setShowNewMarkerOptions] = useState(false);
  const [showMarkerOptions, setShowMarkerOptions] = useState(false);

  const cameraAction = useRef<((uri: string) => void) | undefined>(undefined);
  const cameraRef = useRef<CameraView>(null);

  const addPhotoToMarker = (photoUri: string) => {
    if (!selectedMarker) return;
    addPhotos(selectedMarker.id, [photoUri]);
  };

  const handleNewMarkerFromCameraRoll = async () => {
    setShowNewMarkerOptions(false);
    const result = await pickPhotoFromLibrary(0);
    if (!result || !tempMarker) return;

    addMarker(
      tempMarker.x,
      tempMarker.y,
      result.map((p) => p.uri),
    );
  };

  const handleNewMarkerFromPicture = async () => {
    setShowNewMarkerOptions(false);
    setShowCamera(true);
    if (!tempMarker) return;

    cameraAction.current = (img) => {
      addMarker(tempMarker.x, tempMarker.y, [img]);
    };
  };

  const handleAddFromCameraRollToMarker = async () => {
    setShowNewMarkerOptions(false);
    const result = await pickPhotoFromLibrary(0);
    if (!result || !selectedMarker) return;

    addPhotos(
      selectedMarker.id,
      result.map((p) => p.uri),
    );
  };

  const handleAddFromPictureToMarker = async () => {
    setShowNewMarkerOptions(false);
    const result = await pickPhotoFromLibrary(0);
    if (!result || !selectedMarker) return;

    addPhotos(
      selectedMarker.id,
      result.map((p) => p.uri),
    );
  };

  const handleDeletePhoto = (photoURI: string) => {
    if (!selectedMarker) return;
    removePhoto(selectedMarker.id, photoURI);

    //ToDo add check to delete marker, if necessary
  };

  const pickPhotoFromLibrary = async (selectionLimit = 1) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      selectionLimit,
      allowsEditing: false,
      quality: 1,
    });
    if (res.canceled) return null;
    return res.assets;
  };

  const handleShowPhotos = () => {
    setShowMarkerOptions(false);
    setShowPhotos(true);
  };

  const closeAllModals = () => {
    setShowCamera(false);
    setShowPhotos(false);
    setSelectedMarker(null);
    setNewMarkerPosition(null);
    setShowMarkerOptions(false);
    setShowTempMarker(false);
  };

  if (showCamera) {
    return (
      <CameraUI onPictureTaken={cameraAction.current} cameraRef={cameraRef} />
    );
  }

  // Show floor plan picker if no floor plan selected
  if (!floorplan) {
    return (
      <View style={styles.pickerContainer}>
        <StatusBar style="auto" />
        <Text style={styles.title}>Floor Plan Marker</Text>
        <Text style={styles.subtitle}>
          Select a floor plan image to get started
        </Text>
        <TouchableOpacity style={styles.pickButton} onPress={pickFloorplan}>
          <Text style={styles.pickButtonText}>Select Floor Plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <StatusBar style="auto" />

        {/* Header with change floor plan option */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Floor Plan</Text>
          <TouchableOpacity onPress={pickFloorplan}>
            <Text style={styles.headerButton}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Floor plan with markers. THIS IS WHERE PINCH-TO-ZOOM FUNCTIONALITY SHOULD GO */}
        <ResumableZoom
          extendGestures
          onTap={handleCanvasPress} // TODO: handleCanvasPress should be proven to work with the TapGestureEvent
        >
          <View style={styles.canvas}>
            <Image
              source={{ uri: floorplan }}
              style={styles.floorPlanImage}
              resizeMode="contain"
            />
            {/* Render markers */}
            {markers.map((marker) => (
              <View
                key={marker.id}
                style={[styles.marker, {  /* (x,y) should be the center of the marker */
                  left: marker.x - (styles.marker.width / 2),
                  top: marker.y - (styles.marker.height / 2)
                }]}
              >
                <View style={styles.markerDot} />
                <Text style={styles.markerCount}>{marker.photos.length}</Text>
              </View>
            ))}

            {/* New marker popup */}
            {showMarkerOptions && tempMarker && <EditMarkerModal
              tempMarker={tempMarker}
              onCancel={() => {
                setShowMarkerOptions(false);
                setShowTempMarker(false);
              }}
              onAddPicture={() => {

              }} />}
          </View>
        </ResumableZoom>

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
                onPress={handleNewMarkerFromPicture}
              >
                <Text style={styles.optionText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleNewMarkerFromCameraRoll}
              >
                <Text style={styles.optionText}>Choose from Library</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionCancelButton}
                onPress={() => setShowTempMarker(false)}
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
                onPress={handleAddFromPictureToMarker}
              >
                <Text style={styles.optionText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleAddFromCameraRollToMarker}
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
                    onPress={() => handleDeletePhoto(photo)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>

        <Text style={styles.instructions}>
          Tap on the floor plan to place a marker
        </Text>
      </View>
    </GestureHandlerRootView>
  );
}

const { height, width } = Dimensions.get('window');

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
    width: width,
    height: height,
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
