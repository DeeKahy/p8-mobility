import { StyleSheet, Text, View } from "react-native";

// Renders normal item text.
function item(text: string) {
  return <Text style={styles.item}>{text}</Text>;
}

// Renders the user guide text content.
export default function UserGuideItemsContent() {
  return (
    <View>
      {item("Take 50-150 photos for a normal room.")}
      {item(
        "Take extra photos of door frames, floors, corners, cabinets and fridges."
      )}
      {item("Use clear photos with good light.")}
      {item("Avoid blurry photos.")}
      {item("Move around the room and cover each wall.")}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    fontSize: 18,
    marginBottom: 16,
  },
});
