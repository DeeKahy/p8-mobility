import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

import { Overlay } from "../../context/Overlays";
import { styles } from "../../css/indexStyle";
import { Marker } from "../../hooks/useMarkers";
import { PhotoData } from "../../models/PhotoFormModel";

interface PhotoGalleryModalProps {
  showModal: boolean;
  marker: Marker | undefined;
  handleDeletePhoto: (photo: PhotoData) => void;
  closeAllModals: () => void;
}

export const PhotoGalleryModal = (props: PhotoGalleryModalProps) => {
  const { showModal, marker, handleDeletePhoto, closeAllModals } = props;
  if (!showModal) return null;
  return (
    <Overlay>
      <Animated.View
        style={styles.photosModal}
        entering={SlideInDown}
        exiting={SlideOutDown}
      >
        <View style={styles.photosHeader}>
          <Text style={styles.photosTitle}>
            Photos ({marker?.photos.length})
          </Text>
          <TouchableOpacity onPress={closeAllModals}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.photosGrid}>
          {marker?.photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image
                source={{ uri: photo.photoUri }}
                style={styles.photoThumbnail}
              />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePhoto(photo)}
              >
                <Text style={styles.deleteButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </Overlay>
  );
};
