import { useEffect, useState } from "react";

const now = () => Date.now();

export function useNow(intervalMs = 250) {
  const [timeNow, setTimeNow] = useState(now());

  useEffect(() => {
    const t = setInterval(() => setTimeNow(now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  return timeNow;
}
