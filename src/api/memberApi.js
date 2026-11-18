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

// 판매자 등록 동의 문구 → data: { version, title, content(줄바꿈 포함 일반 텍스트) }
// TODO(member): 응답을 받지 못하면 화면은 시안 문구(SELLER_CONSENT_FALLBACK)를 기본값으로 씀
export function getSellerConsentPolicy() {
  return client.get('/api/v1/sellers/consent-policy');
}

// 판매자 등록: 검수 동의(reviewConsentAgreed=true)와 동의한 문구 버전이 필수
// (버전이 현재 것이 아니면 409 REVIEW_CONSENT_VERSION_MISMATCH)
export function registerSeller(intro, reviewConsentVersion) {
  return client.post('/api/v1/sellers', { intro, reviewConsentAgreed: true, reviewConsentVersion });
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

// ===== 비밀번호 재설정 (시안 06-2, BE docs/reference/external-apis.md 「비밀번호 재설정 · 가입 계정 안내」) =====
// 발송은 가입 여부와 관계없이 같은 200 (가입된 이메일이면 메일이 감)
export function sendPasswordResetCode(email) {
  return client.post('/api/v1/auth/email/send', { email, purpose: 'PASSWORD_RESET' });
}

// 인증번호 확인 → data: { resetToken, expiresIn }. 틀림 · 만료 · 한도 초과는 모두 400 EMAIL_CODE_INVALID
export function verifyPasswordResetCode({ email, code }) {
  return client.post('/api/v1/auth/email/verify', { email, code, purpose: 'PASSWORD_RESET' });
}

// 새 비밀번호 저장 (성공하면 모든 기기 로그아웃). 토큰 오류는 400 INVALID_RESET_TOKEN
export function resetPassword({ resetToken, newPassword }) {
  return client.post('/api/v1/auth/passwordResets', { resetToken, newPassword });
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

// 계좌 변경 (BE docs/reference/external-apis.md 「계좌 변경」)
// ① 회원 정보의 이메일로 인증번호 발송 → data: { expiresIn, resendAvailableIn }
export function sendAccountEmailCode() {
  return client.post('/api/v1/users/me/account/verifications');
}

// ② 인증번호 확인 → data: { accountChangeToken, expiresIn(600초) }
export function verifyAccountEmailCode(code) {
  return client.post('/api/v1/users/me/account/changeTokens', { code });
}

// ③ 계좌 변경 form = { accountChangeToken, bankCode(3자리), accountNo, accountHolder }
//    토큰 오류(만료 · 이미 사용 등)는 400 INVALID_ACCOUNT_CHANGE_TOKEN → 이메일 인증부터 다시
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

// 회원 탈퇴. 막히면 409 + 막힌 이유, 확인하지 못하면 결과 UNAVAILABLE (시안 06-5-11 · 06-5-12)
// TODO(member): 외부 응답 형식이 아직 docs에 없음. 지금은 실패 응답 data = { result, details } 또는 details 그대로를 읽음
//   details = { pendingOrderCount, activeSellerOrderCount, walletBalance, hasPendingTransactions, incompleteSettlementCount, outstandingDebt }
export function withdraw() {
  return client.delete('/api/v1/users/me');
}

// 판매자 공개 정보 (로그인 없이 조회, 숫자 id만) → { sellerId, nickname, intro, createdAt }
// BE docs/reference/external-apis.md member `GET sellers/{sellerId}`
// TODO: 판매 완료 수는 응답에 없음 (판매자 상점 B안에 필요) → 필드 추가 요청
export function getSeller(sellerId) {
  return client.get(`/api/v1/sellers/${sellerId}`);
}
