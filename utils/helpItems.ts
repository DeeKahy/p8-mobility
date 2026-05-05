/**
 * This is where we should outline the flow and how to use the application.
 * Here all gestures and how to use the application will be.
 */
export const helpItems = [
  `# UI flow overview

## Tabs

- \`Camera\`: take a photo first, then place it on the floorplan.
- \`Floorplan\`: select floorplan, place markers, add photos, view photos.
- \`debug\`: see logs and clear data.

## Floorplan start

1. Open \`Floorplan\`.
2. If no floorplan is selected, press \`Add from gallery\`.
3. Pick a floorplan image.
4. The floorplan opens with zoom and pan.

You can also pick a saved floorplan from \`MyFloorPlans\`.

## Floorplan gestures

- \`Pan\`: move around the floorplan.
- \`Pinch\`: zoom in and out.
- \`Tap empty space\`: place a preview marker.
- \`Tap existing marker\`: open marker options.
- \`Long press\`: confirm camera-first image placement.

## Add marker first

1. Open \`Floorplan\`.
2. Tap an empty place on the floorplan.
3. A preview marker appears.
4. Press \`Add picture for this space?\`.
5. Choose \`Take Photo\` or \`Choose from Library\`.
6. Fill in the photo form.
7. Press \`Done\`.

This creates a new marker with the photo.

## Add photo from camera first

1. Open \`Camera\`.
2. Take a photo.
3. The app returns to \`Floorplan\`.
4. A preview marker appears in the middle of the visible floorplan.
5. Pan or zoom until the preview marker is where you want it.
6. Tap somewhere to move the preview faster.
7. Long press on the floorplan to confirm placement.
8. Fill in the photo form.
9. Press \`Done\`.

If the preview marker is near an existing marker, the photo is added to that marker.

If it is not near an existing marker, a new marker is created.

## Select existing marker

1. Open \`Floorplan\`.
2. Tap an existing marker.
3. \`Marker Options\` opens.

Options:

- \`Show Pictures\`: opens the marker photo gallery.
- \`Take Photo\`: adds a new camera photo to the marker.
- \`Choose from Library\`: adds a library photo to the marker.
- \`Cancel\`: closes the modal.

## View marker photos

1. Tap a marker.
2. Press \`Show Pictures\`.
3. The photo gallery opens.
4. Press \`Close\` to exit.
5. Press \`x\` on a photo to delete it.

## Photo form

The photo form appears after choosing or taking a photo.

Fill in:

- \`Picture name\`
- \`Area group\`
- \`Description\`

Then press:

- \`Done\`: saves the photo.
- \`Cancel\`: skips that photo.

## Show all photos

1. Open \`Floorplan\`.
2. Press \`Show photos\`.
3. Press \`Hide photos\` to close the list.

## Change floorplan

1. Open \`Floorplan\`.
2. Press \`Change\`.
3. Pick another floorplan image.

## Debug

1. Open \`debug\`.
2. Press a log group to expand or collapse it.
3. Press \`Clear Logs\` to clear local logs.
4. Press \`Clear All User Data\` to delete saved floorplans and markers.

## AR flow

1. Open the AR screen if available.
2. Wait for AR support check.
3. Measure points.
4. Press \`Stop Measuring\`.
5. The app opens floorplan creation with the measured points.`,
];
