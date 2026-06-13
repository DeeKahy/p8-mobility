import { Point3D, Point2D } from "../models/3Dpoints";
// Validates that a value is a proper 3D coordinate
export function isValidPoint(position: unknown): position is Point3D {
  return (
    Array.isArray(position) &&
    position.length === 3 &&
    position.every(
      (value) => typeof value === "number" && Number.isFinite(value)
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

export function to2D(p: Point3D): Point2D {
  return [p[0], p[2]];
}

export function distance2D(p1: Point2D, p2: Point2D): number {
  const dx = p2[0] - p1[0];
  const dz = p2[1] - p1[1];
  return Math.sqrt(dx ** 2 + dz ** 2);
}

export function calculateTurf(points: Point3D[]) {
  if (!points || points.length < 3) return 0;
  const listOfPoints = [];
  for (const point of points) {
    listOfPoints.push([point[0], point[1]]);
  }
  listOfPoints.push([points[0][0], points[0][1]]);
  return listOfPoints;
}

export function formatDistanceCm(distanceMeters: number) {
  return `${(distanceMeters * 100).toFixed(2)} cm`;
}

export function lerp(v1: number, v2: number, a: number): number {
  return (v2 - v1) * a + v1;
}

export function lerp2D(p1: Point2D, p2: Point2D, a: number): Point2D {
  return [lerp(p1[0], p2[0], a), lerp(p1[1], p2[1], a)];
}

export function lerp3D(p1: Point3D, p2: Point3D, a: number): Point3D {
  return [lerp(p1[0], p2[0], a), lerp(p1[1], p2[1], a), lerp(p1[2], p2[2], a)];
}

export function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

export function toDegrees(radians: number) {
  return radians * (180 / Math.PI);
}

export function rotate2D(
  ps: Point2D[],
  [cx, cy]: Point2D,
  radians: number
): Point2D[] {
  // Applying a 2D-rotation matrix to each point
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return ps.map(([x, y]: Point2D) => {
    const dx = x - cx;
    const dy = y - cy;
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
  });
}

export function boundingBox(ps: Point2D[]) {
  const minX = Math.min(...ps.map((p) => p[0]));
  const minY = Math.min(...ps.map((p) => p[1]));
  const maxX = Math.max(...ps.map((p) => p[0]));
  const maxY = Math.max(...ps.map((p) => p[1]));
  return { minX, minY, maxX, maxY };
}
