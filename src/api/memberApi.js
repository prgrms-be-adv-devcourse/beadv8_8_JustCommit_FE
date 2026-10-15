import client from './client';

// 로그인: 성공 시 Refresh 토큰은 백엔드가 HttpOnly 쿠키로 설정
export function login({ email, password }) {
  return client.post('/api/v1/auth/login', { email, password });
}

// 로그아웃: Refresh 토큰 폐기 + 쿠키 삭제
export function logout() {
  return client.post('/api/v1/auth/logout');
}

// 내 정보 조회: Access 토큰 필요 (client가 자동 첨부)
export function getMyInfo() {
  return client.get('/api/v1/users/me');
}

export function sendEmailCode(email) {
  return client.post('/api/v1/auth/email/send', { email });
}

export function verifyEmailCode({ email, code }) {
  return client.post('/api/v1/auth/email/verify', { email, code });
}

export function checkNickname(nickname) {
  return client.get('/api/v1/users/checkNickname', { params: { nickname } });
}

export function signup(form) {
  return client.post('/api/v1/users', form);
}

export function registerSeller(intro) {
  return client.post('/api/v1/sellers', { intro });
}

export function checkPhone(phone) {
  return client.get('/api/v1/users/checkPhone', { params: { phone } });
}

export function getAddresses() {
  return client.get('/api/v1/users/me/addresses');
}

export function addAddress(form) {
  return client.post('/api/v1/users/me/addresses', form);
}

export function setDefaultAddress(addressId) {
  return client.patch(`/api/v1/users/me/addresses/${addressId}/default`);
}
