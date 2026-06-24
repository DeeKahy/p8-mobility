import { useRef, useState } from "react";

// Keep the rotation angle at 0-359
const normalizeAngle = (deg: number) => ((deg % 360) + 360) % 360;

export default function useRotation() {
  const [rotation, setRotation] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dirMultiplier = useRef(1); // Increases while rotating. Resets when rotation stops.

  // Start spinning while finger is held down
  //-1 and 1 is due to the fact that we can either rotate clockwise or counter clockwise
  function startRotating(dir: 1 | -1) {
    setRotation((r) => normalizeAngle(r + dir));
    //Spins every 75ms
    intervalRef.current = setInterval(() => {
      const degrees = dir * Math.floor(dirMultiplier.current);
      setRotation((r) => normalizeAngle(r + degrees));
      if (dirMultiplier.current < 4) dirMultiplier.current += 0.1; // Cap rotation speed
    }, 75);
  }

  // Stop when finger lifts
  function stopRotating() {
    //Resets interval to stop it from continueing even after finger lift
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      dirMultiplier.current = 1;
    }
  }

  function resetRotation() {
    setRotation(0);
  }

  return { rotation, startRotating, stopRotating, resetRotation };
}
