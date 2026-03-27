import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { styles } from "../../css/indexStyle";
import { Marker } from "../../hooks/useMarkers";

interface PhotoGalleryModalProps {
  showModal: boolean;
  marker: Marker | undefined;
  handleDeletePhoto: (photoURI: string) => void;
  closeAllModals: () => void;
}

export const PhotoGalleryModal = (props: PhotoGalleryModalProps) => {
  const { showModal, marker, handleDeletePhoto, closeAllModals } = props;

  return (
    <Modal visible={showModal} transparent animationType="slide">
      <View style={styles.photosModal}>
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
  );
};
