import { useEffect, useRef } from 'react';

/**
 * active가 true인 동안 interval 간격으로 poll()을 다시 부름 (BE 취소 saga처럼 비동기로 끝나는 처리를 기다릴 때)
 * - active가 true → false로 바뀌면(처리가 끝나면) onDone()을 한 번 부름
 * - timeout이 지나도 끝나지 않으면 멈추고 지금 화면을 그대로 둠
 * - 화면을 떠나거나 active가 false가 되면 타이머를 정리
 */
function usePollWhile(active, poll, { interval = 2500, timeout = 120000, onDone } = {}) {
  const pollRef = useRef(poll);
  const onDoneRef = useRef(onDone);
  const wasActive = useRef(false);

  useEffect(() => {
    pollRef.current = poll;
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (!active) {
      if (wasActive.current) onDoneRef.current?.();
      wasActive.current = false;
      return undefined;
    }
    wasActive.current = true;
    const startedAt = Date.now();
    let timer;
    let stopped = false;
    const tick = async () => {
      if (stopped || Date.now() - startedAt >= timeout) return;
      try {
        await pollRef.current();
      } catch {
        // 한 번 실패해도 다음 간격에 다시 조회
      }
      if (!stopped) timer = setTimeout(tick, interval);
    };
    timer = setTimeout(tick, interval);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [active, interval, timeout]);
}

export default usePollWhile;
