import {Point3D} from '../app/models/3Dpoints'
// Validates that a value is a proper 3D coordinate
export function isValidPoint(position: unknown): position is Point3D {
  return (
    Array.isArray(position) &&
    position.length === 3 &&
    position.every(
      (value) => typeof value === 'number' && Number.isFinite(value)
    )
  );
}

//Measuring distance formula (Euclidean distance)
export function calculateDistanceMeters(points: [Point3D, Point3D]) {
  const [p1, p2] = points;
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
}

export function formatDistanceCm(distanceMeters: number) {
  return `${(distanceMeters * 100).toFixed(2)} cm`;
}