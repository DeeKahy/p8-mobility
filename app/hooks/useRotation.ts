import { useRef, useState } from "react";

export function useRotation(){
  const [rotation, setRotation] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start spinning while finger is held down
  //-1 and 1 is due to the fact that we can either rotate clockwise or counter clockwise
    function startRotating(dir: 1 | -1) {
      setRotation((r) => r + dir); 
      //Spins every 75ms  
      intervalRef.current = setInterval(() => {
        setRotation((r) => r + dir);
      }, 75);
    }
  
    // Stop when finger lifts
    function stopRotating() {
      //Resets interval to stop it from continueing even after finger lift
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