import { useCallback, useEffect, useState } from 'react';

/**
 * 초 단위 카운트다운
 * start(초)로 시작하고, remaining이 0이 되면 자동으로 멈춤
 */
function useCountdown() {
  const [endAt, setEndAt] = useState(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (endAt === null) return undefined;

    const timerId = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) setEndAt(null);
    }, 1000);

    return () => clearInterval(timerId);
  }, [endAt]);

  const start = useCallback((seconds) => {
    setRemaining(seconds);
    setEndAt(Date.now() + seconds * 1000);
  }, []);

  const stop = useCallback(() => {
    setEndAt(null);
    setRemaining(0);
  }, []);

  return { remaining, isRunning: remaining > 0, start, stop };
}

export default useCountdown;
