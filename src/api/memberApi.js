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
  return client.get('/api/v1/users/nicknameAvailability', { params: { nickname } });
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
  return client.get('/api/v1/users/phoneAvailability', { params: { phone } });
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

// ===== 회원 정보 수정 (시안 06-5, BE MemberController · AccountController · AddressController · WithdrawalController) =====

// 닉네임 변경 (2~8자, 중복 불가) → data: { memberId, nickname }. 중복은 409 DUPLICATE_NICKNAME
export function changeNickname(nickname) {
  return client.patch('/api/v1/users/me/nickname', { nickname });
}

// 비밀번호 변경 (현재 비밀번호 확인 후, 모든 기기 로그아웃 · 소셜 회원은 없음) → data: { revocationCompleted }
// 성공하면 서버가 이 기기 Refresh 쿠키를 만료. 실패: 400 INVALID_CURRENT_PASSWORD · SAME_AS_CURRENT_PASSWORD · PASSWORD_NOT_SET,
// 429 PASSWORD_CHANGE_LOCKED(+ Retry-After), 503 RESULT_UNKNOWN(자동 재요청 금지)
export function changePassword({ currentPassword, newPassword }) {
  return client.patch('/api/v1/users/me/password', { currentPassword, newPassword });
}

// 계좌 변경 (BE docs/reference/external-apis.md 「계좌 변경」)
// ① 회원 정보의 이메일로 인증번호 발송 → data: { expiresIn, resendAvailableIn }
export function sendAccountEmailCode() {
  return client.post('/api/v1/users/me/account/verifications');
}

// ② 인증번호 확인 → data: { accountChangeToken, expiresIn(600초) }
//    번호는 맞지만 발송 뒤 회원 정보가 바뀌었으면 400 ACCOUNT_VERIFICATION_INVALID → 인증번호부터 다시
export function verifyAccountEmailCode(code) {
  return client.post('/api/v1/users/me/account/changeTokens', { code });
}

// ③ 계좌 변경 form = { accountChangeToken, bankCode(3자리), accountNo, accountHolder }
//    토큰 오류(만료 · 이미 사용 등)는 400 INVALID_ACCOUNT_CHANGE_TOKEN → 이메일 인증부터 다시. 성공 시 data 없음
export function changeAccount(form) {
  return client.patch('/api/v1/users/me/account', form);
}

// 배송지 부분 수정: 보낸 항목만 바뀜. 기본 여부(isDefault)는 받지 않음 → setDefaultAddress로
// 주소(zipcode · address1)를 바꿀 때는 address2도 함께 (없으면 400 ADDRESS_DETAIL_REQUIRED, 비우려면 '')
// 삭제: 기본 배송지는 409 DEFAULT_ADDRESS_NOT_DELETABLE
export function updateAddress(addressId, form) {
  return client.patch(`/api/v1/users/me/addresses/${addressId}`, form);
}

export function deleteAddress(addressId) {
  return client.delete(`/api/v1/users/me/addresses/${addressId}`);
}

// ===== 회원 탈퇴 (BE WithdrawalController, docs/flows/signup-and-replica.md 「직접 탈퇴」) =====
// 탈퇴 가능 여부 (화면 안내용) → data: { status: 'ALLOWED' | 'BLOCKED', blockers: [{ service, reasons[], details }] }
//   service: market(details activeBuyerOrderCount · activeSellerOrderCount)
//            payment(walletBalance · hasPendingTransactions · outstandingDebt) · settlement(incompleteSettlementCount)
//   확인하지 못하면 503 WITHDRAWAL_CHECK_UNAVAILABLE (일부 사유도 주지 않음)
export function getWithdrawalEligibility() {
  return client.get('/api/v1/users/me/withdrawal');
}

// 최종 탈퇴: 로컬 회원은 password, 카카오 회원은 withdrawalToken 하나만 (둘 다 · 둘 다 없음은 400 BAD_REQUEST_DATA)
// → data: { revocationCompleted }. 성공하면 서버가 이 기기 Refresh 쿠키를 만료
// 실패: 400 INVALID_CURRENT_PASSWORD · INVALID_WITHDRAWAL_TOKEN, 429 PASSWORD_CHANGE_LOCKED(+ Retry-After),
//       409 WITHDRAWAL_BLOCKED(사유는 getWithdrawalEligibility로), 503 WITHDRAWAL_CHECK_UNAVAILABLE · SOCIAL_UNLINK_FAILED · RESULT_UNKNOWN
export function withdraw({ password, withdrawalToken } = {}) {
  return client.post('/api/v1/users/me/withdrawal', { password, withdrawalToken });
}

// 카카오 회원 재확인 ① 회원 정보의 이메일로 인증번호 발송 → data: { expiresIn, resendAvailableIn }
export function sendWithdrawalEmailCode() {
  return client.post('/api/v1/users/me/withdrawal/verifications');
}

// 카카오 회원 재확인 ② 인증번호 확인 → data: { withdrawalToken, expiresIn }
// 번호는 맞지만 발송 뒤 회원 정보가 바뀌었으면 400 WITHDRAWAL_VERIFICATION_INVALID
export function verifyWithdrawalEmailCode(code) {
  return client.post('/api/v1/users/me/withdrawal/tokens', { code });
}

// 판매자 공개 정보 (로그인 없이 조회, 숫자 id만) → { sellerId, nickname, intro, createdAt }
// BE docs/reference/external-apis.md member `GET sellers/{sellerId}`
// TODO: 판매 완료 수는 응답에 없음 (판매자 상점 B안에 필요) → 필드 추가 요청
export function getSeller(sellerId) {
  return client.get(`/api/v1/sellers/${sellerId}`);
}

// 내 판매자 소개글 수정 (판매자만, 500자) → data: { sellerId, nickname, intro, createdAt }
// intro는 필수: 지우려면 ''를 보냄. 판매자가 아니면 403 NOT_SELLER
// TODO: 소개글 수정 화면이 아직 없음 (시안 먼저)
export function changeSellerIntro(intro) {
  return client.patch('/api/v1/sellers/me/intro', { intro });
}
