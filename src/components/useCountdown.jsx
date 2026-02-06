// src/components/auth/useCountdown.js
import * as React from "react";

export default function useCountdown(seconds) {
  const [left, setLeft] = React.useState(0);
  React.useEffect(() => {
    if (left <= 0) return;
    const id = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [left]);
  const start = React.useCallback(() => setLeft(seconds), [seconds]);
  return { left, start };
}
