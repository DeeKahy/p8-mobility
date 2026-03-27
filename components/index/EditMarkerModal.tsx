import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EditMarkerModalProps {
  tempMarker: {
    x: number;
    y: number;
  };
  onCancel: () => void;
  onAddPicture: () => void;
}

export const EditMarkerModal = (props: EditMarkerModalProps) => {
  const { tempMarker, onCancel, onAddPicture } = props;

  return (
    <View
      style={[
        styles.popup,
        {
          left: tempMarker.x - 82,
          top: tempMarker.y - 120,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.popupButton}
        onPress={onAddPicture}
      >
        <Text style={styles.popupText}>Add picture for this space?</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.popupCancel}
        onPress={onCancel}
      >
        <Text style={styles.popupCancelText}>Cancel</Text>
      </TouchableOpacity>
      <View style={styles.popupArrow} />
    </View>
  );
};

const styles = StyleSheet.create({
  popup: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    width: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  popupButton: {
    padding: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    marginBottom: 8,
  },
  popupText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 13,
  },
  popupCancel: {
    padding: 8,
  },
  popupCancelText: {
    color: "#666",
    textAlign: "center",
    fontSize: 12,
  },
  popupArrow: {
    position: "absolute",
    bottom: -10,
    left: "50%",
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
  },
});