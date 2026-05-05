import { StyleSheet, Text, View } from "react-native";

// Renders the help text content.
export default function HelpItemsContent() {
  return (
    <View>
      <Text style={styles.subheading}>Tabs</Text>
      <Text style={styles.item}>- Camera: take a photo first, then place it on the floorplan.</Text>
      <Text style={styles.item}>- Floorplan: select floorplan, place markers, add photos, view photos.</Text>

      <Text style={styles.subheading}>Floorplan start</Text>
      <Text style={styles.item}>1. Open Floorplan.</Text>
      <Text style={styles.item}>2. If no floorplan is selected, press Add from gallery.</Text>
      <Text style={styles.item}>3. Pick a floorplan image.</Text>
      <Text style={styles.item}>4. The floorplan opens with zoom and pan.</Text>
      <Text style={styles.item}>You can also pick a saved floorplan from MyFloorPlans.</Text>

      <Text style={styles.subheading}>Floorplan gestures</Text>
      <Text style={styles.item}>- Pan: move around the floorplan.</Text>
      <Text style={styles.item}>- Pinch: zoom in and out.</Text>
      <Text style={styles.item}>- Tap empty space: place a preview marker.</Text>
      <Text style={styles.item}>- Tap existing marker: open marker options.</Text>
      <Text style={styles.item}>- Long press: confirm camera-first image placement.</Text>

      <Text style={styles.subheading}>Add marker first</Text>
      <Text style={styles.item}>1. Open Floorplan.</Text>
      <Text style={styles.item}>2. Tap an empty place on the floorplan.</Text>
      <Text style={styles.item}>3. A preview marker appears.</Text>
      <Text style={styles.item}>4. Press Add picture for this space?.</Text>
      <Text style={styles.item}>5. Choose Take Photo or Choose from Library.</Text>
      <Text style={styles.item}>6. Fill in the photo form.</Text>
      <Text style={styles.item}>7. Press Done.</Text>
      <Text style={styles.item}>This creates a new marker with the photo.</Text>

      <Text style={styles.subheading}>Add photo from camera first</Text>
      <Text style={styles.item}>1. Open Camera.</Text>
      <Text style={styles.item}>2. Take a photo.</Text>
      <Text style={styles.item}>3. The app returns to Floorplan.</Text>
      <Text style={styles.item}>4. A preview marker appears in the middle of the visible floorplan.</Text>
      <Text style={styles.item}>5. Pan or zoom until the preview marker is where you want it.</Text>
      <Text style={styles.item}>6. Tap somewhere to move the preview faster.</Text>
      <Text style={styles.item}>7. Long press on the floorplan to confirm placement.</Text>
      <Text style={styles.item}>8. Fill in the photo form.</Text>
      <Text style={styles.item}>9. Press Done.</Text>
      <Text style={styles.item}>If the preview marker is near an existing marker, the photo is added to that marker.</Text>
      <Text style={styles.item}>If it is not near an existing marker, a new marker is created.</Text>

      <Text style={styles.subheading}>Select existing marker</Text>
      <Text style={styles.item}>1. Open Floorplan.</Text>
      <Text style={styles.item}>2. Tap an existing marker.</Text>
      <Text style={styles.item}>3. Marker Options opens.</Text>
      <Text style={styles.item}>Options:</Text>
      <Text style={styles.item}>- Show Pictures: opens the marker photo gallery.</Text>
      <Text style={styles.item}>- Take Photo: adds a new camera photo to the marker.</Text>
      <Text style={styles.item}>- Choose from Library: adds a library photo to the marker.</Text>
      <Text style={styles.item}>- Cancel: closes the modal.</Text>

      <Text style={styles.subheading}>View marker photos</Text>
      <Text style={styles.item}>1. Tap a marker.</Text>
      <Text style={styles.item}>2. Press Show Pictures.</Text>
      <Text style={styles.item}>3. The photo gallery opens.</Text>
      <Text style={styles.item}>4. Press Close to exit.</Text>
      <Text style={styles.item}>5. Press x on a photo to delete it.</Text>

      <Text style={styles.subheading}>Photo form</Text>
      <Text style={styles.item}>The photo form appears after choosing or taking a photo.</Text>
      <Text style={styles.item}>Fill in:</Text>
      <Text style={styles.item}>- Picture name</Text>
      <Text style={styles.item}>- Area group</Text>
      <Text style={styles.item}>- Description</Text>
      <Text style={styles.item}>Then press:</Text>
      <Text style={styles.item}>- Done: saves the photo.</Text>
      <Text style={styles.item}>- Cancel: skips that photo.</Text>

      <Text style={styles.subheading}>Show all photos</Text>
      <Text style={styles.item}>1. Open Floorplan.</Text>
      <Text style={styles.item}>2. Press Show photos.</Text>
      <Text style={styles.item}>3. Press Hide photos to close the list.</Text>

      <Text style={styles.subheading}>Change floorplan</Text>
      <Text style={styles.item}>1. Open Floorplan.</Text>
      <Text style={styles.item}>2. Press Change.</Text>
      <Text style={styles.item}>3. Pick another floorplan image.</Text>

      <Text style={styles.subheading}>AR flow</Text>
      <Text style={styles.item}>1. Open the AR screen if available.</Text>
      <Text style={styles.item}>2. Wait for AR support check.</Text>
      <Text style={styles.item}>3. Measure points.</Text>
      <Text style={styles.item}>4. Press Stop Measuring.</Text>
      <Text style={styles.item}>5. The app opens floorplan creation with the measured points.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },

  subheading: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 8,
  },

  item: {
    fontSize: 18,
    marginBottom: 8,
  },
});
