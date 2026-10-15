const OAUTH_BASE_URL = import.meta.env.VITE_OAUTH_BASE_URL ?? 'http://localhost:8080';

// 카카오 로그인 시작: 백엔드 OAuth2 진입점으로 페이지 이동
export function startKakaoLogin() {
  window.location.href = `${OAUTH_BASE_URL}/oauth2/authorization/kakao`;
}
