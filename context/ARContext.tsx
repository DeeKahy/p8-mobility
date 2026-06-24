import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";

import { Point3D } from "../models/3Dpoints";

interface ARContextReturn {
  points: Point3D[];
  setPoints: Dispatch<SetStateAction<Point3D[]>>;
  nextPoint: Point3D | null;
  setNextPoint: Dispatch<SetStateAction<Point3D | null>>;
}

const ARContext = createContext<ARContextReturn | undefined>(undefined);

export const ARContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [points, setPoints] = useState<Point3D[]>([]);
  const [nextPoint, setNextPoint] = useState<Point3D | null>(null);

  return (
    <ARContext.Provider
      value={{
        points,
        setPoints,
        nextPoint,
        setNextPoint,
      }}
    >
      {children}
    </ARContext.Provider>
  );
};

export const useAR = () => {
  const context = useContext(ARContext);
  if (context === undefined) {
    throw new Error("useCamera must be used within a ARContextProvider");
  }
  return context;
};
