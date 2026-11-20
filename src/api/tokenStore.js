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
  sessionExpiredListeners.forEach((listener) => listener());
}
