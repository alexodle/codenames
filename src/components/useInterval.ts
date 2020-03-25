import { useEffect, useRef } from "react";

export type UseIntervalCallback = () => void

export const useInterval = (callback: UseIntervalCallback, delay: number | undefined) => {
  const savedCallback = useRef<UseIntervalCallback>();

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    const tick = () => {
      savedCallback.current && savedCallback.current();
    }

    if (delay !== undefined) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
