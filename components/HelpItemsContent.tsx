import { StyleSheet, Text, View } from "react-native";

/*
  JSX examples:
  <Text style={styles.item}>Normal text</Text>
  <Text style={styles.bold}>Bold text</Text>
  <Text style={styles.italic}>Italic text</Text>
  <Text style={styles.subheading}>Section heading</Text>
  <Text style={styles.item}>Text with <Text style={styles.bold}>bold part</Text></Text>
  <View><Text>Group more text inside a view</Text></View>
*/

// Renders bold text.
function bold(text: string) {
  return <Text style={styles.bold}>{text}</Text>;
}

// Renders normal item text.
function item(text: string) {
  return <Text style={styles.item}>{text}</Text>;
}

// Renders an item that starts with bold text.
function bold_then_item(bold_text: string, item_text: string) {
  return <Text style={styles.item}>{bold(bold_text)}{item_text}</Text>;
}
// Renders the help text content.
export default function HelpItemsContent() {
  return (
    <View>
      <Text style={styles.subheading}>Tabs</Text>
      {bold_then_item("Camera", ": Take a photo first, then place it on the floorplan.")}
      {bold_then_item("Floorplan",": Select floorplan, place markers, add photos, view photos.")}
      <Text style={styles.subheading}>Floorplan start</Text>
      {item("1. Open Floorplan.")}
      {item("2. If no floorplan is selected, press Add from gallery.")}
      {item("3. Pick a floorplan image.")}
      {item("4. The floorplan opens with zoom and pan.")}
      {item("You can also pick a saved floorplan from MyFloorPlans.")}

      <Text style={styles.subheading}>Floorplan gestures</Text>
      {item("- Pan: move around the floorplan.")}
      {item("- Pinch: zoom in and out.")}
      {item("- Tap empty space: place a preview marker.")}
      {item("- Tap existing marker: open marker options.")}
      {item("- Long press: confirm camera-first image placement.")}

      <Text style={styles.subheading}>Add marker first</Text>
      {item("1. Open Floorplan.")}
      {item("2. Tap an empty place on the floorplan.")}
      {item("3. A preview marker appears.")}
      {item("4. Press Add picture for this space?.")}
      {item("5. Choose Take Photo or Choose from Library.")}
      {item("6. Fill in the photo form.")}
      {item("7. Press Done.")}
      {item("This creates a new marker with the photo.")}

      <Text style={styles.subheading}>Add photo from camera first</Text>
      {item("1. Open Camera.")}
      {item("2. Take a photo.")}
      {item("3. The app returns to Floorplan.")}
      {item("4. A preview marker appears in the middle of the visible floorplan.")}
      {item("5. Pan or zoom until the preview marker is where you want it.")}
      {item("6. Tap somewhere to move the preview faster.")}
      {item("7. Long press on the floorplan to confirm placement.")}
      {item("8. Fill in the photo form.")}
      {item("9. Press Done.")}
      {item("If the preview marker is near an existing marker, the photo is added to that marker.")}
      {item("If it is not near an existing marker, a new marker is created.")}

      <Text style={styles.subheading}>Select existing marker</Text>
      {item("1. Open Floorplan.")}
      {item("2. Tap an existing marker.")}
      {item("3. Marker Options opens.")}
      {item("Options:")}
      {item("- Show Pictures: opens the marker photo gallery.")}
      {item("- Take Photo: adds a new camera photo to the marker.")}
      {item("- Choose from Library: adds a library photo to the marker.")}
      {item("- Cancel: closes the modal.")}

      <Text style={styles.subheading}>View marker photos</Text>
      {item("1. Tap a marker.")}
      {item("2. Press Show Pictures.")}
      {item("3. The photo gallery opens.")}
      {item("4. Press Close to exit.")}
      {item("5. Press x on a photo to delete it.")}

      <Text style={styles.subheading}>Photo form</Text>
      {item("The photo form appears after choosing or taking a photo.")}
      {item("Fill in:")}
      {item("- Picture name")}
      {item("- Area group")}
      {item("- Description")}
      {item("Then press:")}
      {item("- Done: saves the photo.")}
      {item("- Cancel: skips that photo.")}

      <Text style={styles.subheading}>Show all photos</Text>
      {item("1. Open Floorplan.")}
      {item("2. Press Show photos.")}
      {item("3. Press Hide photos to close the list.")}

      <Text style={styles.subheading}>Change floorplan</Text>
      {item("1. Open Floorplan.")}
      {item("2. Press Change.")}
      {item("3. Pick another floorplan image.")}

      <Text style={styles.subheading}>AR flow</Text>
      {item("1. Open the AR screen if available.")}
      {item("2. Wait for AR support check.")}
      {item("3. Measure points.")}
      {item("4. Press Stop Measuring.")}
      {item("5. The app opens floorplan creation with the measured points.")}
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

  bold: {
    fontWeight: "bold",
  },

  italic: {
    fontStyle: "italic",
  },
});
