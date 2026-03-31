import { useRef, useState } from "react";

export function useRotation(){
  const [rotation, setRotation] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start spinning while finger is held down
    function startRotating(dir: 1 | -1) {
      setRotation((r) => r + dir); 
      intervalRef.current = setInterval(() => {
        setRotation((r) => r + dir);
      }, 75);
    }
  
    // Stop when finger lifts
    function stopRotating() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function resetRotation() {
    setRotation(0);
  }

  return { rotation, startRotating, stopRotating, resetRotation };
}