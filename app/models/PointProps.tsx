import { Point3D } from "./3Dpoints";

export type PointProps = {
  pointList: Point3D[];
  visible: boolean;
  onClose: () => void;
};