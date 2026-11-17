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

// TODO(member): 판매자 등록에는 「상품 사진 외부 전송(검수) · 학습 이용」 동의가 필수 (BE docs/services/member.md 정책 「권한」).
// 지금 API는 intro만 받으므로, 동의 항목(내용 · 버전)이 요청에 추가되면 함께 보냅니다.
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

// 소셜 회원가입: 가입 토큰을 Authorization 헤더로 전달 (응답에 Refresh 쿠키 포함)
export function socialSignup(signupToken, form) {
  return client.post('/api/v1/users/social', form, {
    headers: { Authorization: `Bearer ${signupToken}` },
  });
}

// ---------------------------------------------------------------------------
// 아직 백엔드에 없는 API (BE docs/reference/external-apis.md 「추가 예정」: 아이디 찾기 · 비밀번호 재설정)
// 경로 · 요청 · 응답은 회원 담당이 정하면 채웁니다. 그 전까지는 「준비 중」 오류를 돌려줍니다.
// ---------------------------------------------------------------------------
function notReady() {
  const error = new Error('NOT_READY');
  error.response = { data: { code: 'NOT_READY', message: '아직 준비 중인 기능이에요. 잠시만 기다려 주세요.' } };
  return Promise.reject(error);
}

// TODO(member): 아이디 찾기 인증번호 발송. 예상 응답 data: { expiresIn, resendAvailableIn }
// eslint-disable-next-line no-unused-vars
export function sendFindIdCode(email) {
  return notReady();
}

// TODO(member): 아이디 찾기 인증번호 확인 + 계정 조회.
// 예상 응답 data: { email, provider: 'LOCAL' | 'KAKAO', nickname, joinedAt }
// eslint-disable-next-line no-unused-vars
export function findId({ email, code }) {
  return notReady();
}

// TODO(member): 비밀번호 재설정 인증번호 발송 (이메일 인증 목적: 비밀번호 재설정). 예상 응답 data: { expiresIn, resendAvailableIn }
// eslint-disable-next-line no-unused-vars
export function sendPasswordResetCode(email) {
  return notReady();
}

// TODO(member): 비밀번호 재설정 인증번호 확인
// eslint-disable-next-line no-unused-vars
export function verifyPasswordResetCode({ email, code }) {
  return notReady();
}

// TODO(member): 새 비밀번호 저장 (성공하면 모든 기기 로그아웃)
// eslint-disable-next-line no-unused-vars
export function resetPassword({ email, newPassword }) {
  return notReady();
}

// ===== 회원 정보 수정 (시안 06-5) =====
// BE docs/reference/external-apis.md 「추가할 API」: 닉네임 · 비밀번호 · 계좌 변경, 배송지 수정 · 삭제, 탈퇴는 아직 경로 ⬜
// TODO: 경로 · 요청 형식이 정해지면 맞춥니다. 지금은 임시 경로로 호출합니다 (API가 생기기 전에는 실패 → 화면에 실패 안내).

// 닉네임 변경 (2~8자, 중복 불가)
export function changeNickname(nickname) {
  return client.patch('/api/v1/users/me/nickname', { nickname });
}

// 비밀번호 변경 (현재 비밀번호 확인 후, 모든 기기 로그아웃 · 소셜 회원은 없음)
export function changePassword({ currentPassword, newPassword }) {
  return client.patch('/api/v1/users/me/password', { currentPassword, newPassword });
}

// 계좌 변경용 이메일 인증 (목적별 구분: 가입 · 비밀번호 재설정 · 계좌 변경)
export function sendAccountEmailCode() {
  return client.post('/api/v1/auth/email/send', { purpose: 'ACCOUNT_CHANGE' });
}

export function verifyAccountEmailCode(code) {
  return client.post('/api/v1/auth/email/verify', { purpose: 'ACCOUNT_CHANGE', code });
}

// 계좌 변경 (이메일 재인증 후) form = { bankCode, accountNo, accountHolder }
export function changeAccount(form) {
  return client.patch('/api/v1/users/me/account', form);
}

// 배송지 부분 수정 / 삭제 (기본 배송지는 삭제 불가)
export function updateAddress(addressId, form) {
  return client.patch(`/api/v1/users/me/addresses/${addressId}`, form);
}

export function deleteAddress(addressId) {
  return client.delete(`/api/v1/users/me/addresses/${addressId}`);
}

// 회원 탈퇴. 막히면 409 + 막힌 이유
// 실패 응답 data(임시 이름) = { pendingOrderCount, pendingSellerOrderCount, walletBalance, unpaidSettlementAmount }
export function withdraw() {
  return client.delete('/api/v1/users/me');
}
