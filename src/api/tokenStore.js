let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

// 재발급이 401로 거절돼 로그인이 끝났을 때 알릴 곳 (AuthProvider가 user를 비움)
const sessionExpiredListeners = new Set();

export function onSessionExpired(listener) {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

export function notifySessionExpired() {
  markSessionEnded();
  sessionExpiredListeners.forEach((listener) => listener());
}

// 로그아웃 · 세션 만료로 로그인이 끝난 시각
// 로그인 화면이 "방금 로그인이 끝나서 온 것인지"를 구분하는 데 씀 (그때는 로그인 뒤 원래 페이지가 아니라 홈으로)
const SESSION_JUST_ENDED_MS = 3000;
let sessionEndedAt = 0;

export function markSessionEnded() {
  sessionEndedAt = Date.now();
}

export function isSessionJustEnded() {
  return Date.now() - sessionEndedAt < SESSION_JUST_ENDED_MS;
}
