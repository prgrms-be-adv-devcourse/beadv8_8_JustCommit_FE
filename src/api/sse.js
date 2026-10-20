import { reissueAccessToken } from './client';
import { getAccessToken } from './tokenStore';

// 끊긴 뒤 다시 연결하기까지 기다리는 시간 (실패가 이어질수록 늘림)
const RETRY_DELAYS_MS = [1000, 2000, 5000, 10000, 30000];

/**
 * 로그인 토큰을 붙여 SSE(text/event-stream)에 연결한다.
 * 브라우저 기본 EventSource는 Authorization 헤더를 붙일 수 없어서 fetch 스트림으로 직접 읽는다.
 *
 * - 서버가 연결을 끊거나 네트워크가 끊기면 자동으로 다시 연결
 * - 401이면 토큰을 재발급하고 다시 연결, 재발급도 실패하면 멈춤(로그아웃 상태)
 * - 반환한 함수를 부르면 연결을 끊고 재연결도 멈춤
 *
 * @param {string} path 예: '/api/v1/notifications/subscribe'
 * @param {(event: { name: string, data: string }) => void} onEvent 이벤트마다 호출 (ping 주석은 무시)
 * @returns {() => void} 연결 종료 함수
 */
export function subscribeSse(path, onEvent) {
  const url = `${import.meta.env.VITE_API_BASE_URL ?? ''}${path}`;
  let controller = null;
  let retryTimer = null;
  let attempt = 0;
  let closed = false;
  let reissuedOnce = false; // 재발급 직후에도 401이면 반복하지 않고 멈춤

  const scheduleRetry = () => {
    if (closed) return;
    const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
    attempt += 1;
    retryTimer = setTimeout(connect, delay);
  };

  async function connect() {
    if (closed) return;
    controller = new AbortController();
    try {
      const response = await fetch(url, {
        headers: { Accept: 'text/event-stream', Authorization: `Bearer ${getAccessToken()}` },
        credentials: 'include',
        signal: controller.signal,
      });

      if (response.status === 401) {
        if (reissuedOnce) return;
        reissuedOnce = true;
        try {
          await reissueAccessToken();
        } catch {
          return; // 재발급 실패 = 로그아웃 상태 → 다시 연결하지 않음
        }
        connect();
        return;
      }
      if (!response.ok || !response.body) {
        scheduleRetry();
        return;
      }

      attempt = 0; // 연결 성공 → 재시도 간격·재발급 기회 초기화
      reissuedOnce = false;
      await readEvents(response.body, onEvent);
      scheduleRetry(); // 서버가 연결을 닫음 (타임아웃·재시작 등)
    } catch (error) {
      if (error.name !== 'AbortError') scheduleRetry();
    }
  }

  connect();

  return () => {
    closed = true;
    clearTimeout(retryTimer);
    controller?.abort();
  };
}

// SSE 형식: "event: 이름" / "data: 값" 줄 뒤 빈 줄이 오면 이벤트 하나. ":"로 시작하는 줄은 주석(ping)
async function readEvents(body, onEvent) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let name = 'message';
  let data = [];

  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop(); // 아직 줄바꿈이 안 온 마지막 조각은 다음 읽기로

    for (const line of lines) {
      if (line === '') {
        if (data.length > 0) onEvent({ name, data: data.join('\n') });
        name = 'message';
        data = [];
      } else if (line.startsWith('event:')) {
        name = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        data.push(line.slice(5).trimStart());
      }
    }
  }
}
