// AR hit test types we accept (planes + feature points)
// https://developers.google.com/ar/develop/hit-test
export const ACCEPTED_HIT_TYPES = new Set([
  "ExistingPlaneUsingExtent",
  "ExistingPlane",
  "EstimatedHorizontalPlane",
  "EstimatedVerticalPlane",
  "FeaturePoint",
]);
