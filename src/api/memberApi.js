import client from './client';

// 로그인: 성공 시 Refresh 토큰은 백엔드가 HttpOnly 쿠키로 설정
export function login({ email, password }) {
  return client.post('/api/v1/auth/login', { email, password });
}

// 로그아웃: Refresh 토큰 폐기 + 쿠키 삭제
export function logout() {
  return client.post('/api/v1/auth/logout');
}
