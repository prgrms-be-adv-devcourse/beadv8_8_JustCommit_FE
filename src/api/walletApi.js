import client from './client';

// 예치금 잔액 → { balance, chargeBalance?, withdrawableBalance? }
// chargeBalance(충전금) · withdrawableBalance(인출 가능 금액)는 백엔드 추가 예정 (docs/services/payment.md 「지갑」)
export async function getWalletBalance() {
  try {
    return await client.get('/api/v1/wallet');
  } catch (error) {
    // 지갑은 회원가입 이벤트로 만들어지므로, 이벤트 도입 전 가입자·전송 실패 회원은 지갑이 없을 수 있음
    // → 아직 충전한 적 없는 것과 같으니 잔액 0원으로 처리 (응답과 같은 모양으로 반환)
    if (error.response?.data?.code === 'WALLET_NOT_FOUND') {
      return { data: { data: { balance: 0, chargeBalance: 0, withdrawableBalance: 0 } } };
    }
    throw error;
  }
}

// 거래 내역 → Spring Page 형식 { content, totalElements, totalPages, number, last, ... }
// refType은 하나만 받음 (탭별 묶음은 화면에서 거름)
export function getWalletTransactions(params = {}) {
  return client.get('/api/v1/wallet/transactions', { params });
}

// 충전 요청 생성 → { chargeId, pgOrderNo(토스 orderId), amount, status } (최소 10,000원)
export function createCharge(amount) {
  return client.post('/api/v1/wallet/charges', { amount });
}

// 충전 승인은 토스 승인을 최대 60초 기다림 → 게이트웨이 payment-charge-confirm 라우트(65초)에 맞춰 이 요청만 늘림
const CHARGE_CONFIRM_TIMEOUT_MS = 65000;

// 토스 결제 성공 후 승인 → { chargeId, status, pgOrderNo, amount, balanceAfter, approvedAt }
// status: APPROVED(적립 완료) | PENDING(결과 불명 · 반영 실패, 200 "충전 처리 중입니다." · balanceAfter는 적립 전 잔액)
export function confirmCharge(chargeId, { paymentKey, orderId, amount }) {
  return client.post(
    `/api/v1/wallet/charges/${chargeId}/confirm`,
    { paymentKey, orderId, amount },
    { timeout: CHARGE_CONFIRM_TIMEOUT_MS },
  );
}

// 인출 신청 (인출 가능 금액 안에서, 받는 계좌는 서버가 member에서 조회)
// Idempotency-Key 필수: 같은 키로 다시 보내면 처음 결과 (금액이 다르면 409 IDEMPOTENCY_KEY_CONFLICT)
// 응답: { cashOutId, amount, status, accountLast4, balanceAfter } (은행 이름 · 신청 시각 없음)
// status: PENDING | COMPLETED (지급 실패도 200 + PENDING)
export function requestCashOut(amount, idempotencyKey) {
  return client.post('/api/v1/wallet/cashOuts', { amount }, { headers: { 'Idempotency-Key': idempotencyKey } });
}

// 인출 내역 → Spring Page { content: [{ cashOutId, amount, status, accountLast4, requestedAt, completedAt }], ... }
// 기본 20건, 신청 시각 최신순. 지갑이 없으면 빈 목록
// TODO: 은행 이름(bankCode)이 응답에 없음 · 이체 실패 상태는 #389에서 추가 예정
export function getCashOuts(params = {}) {
  return client.get('/api/v1/wallet/cashOuts', { params });
}

// ===== 아래는 백엔드 API가 아직 없는 기능 (docs/reference/external-apis.md 「추가 예정」 payment) =====
// 경로는 담당이 확정 전이라 임시로 적어 둠. 화면은 지금 이 함수 결과 대신 자리 문구를 보여 줌

// TODO: 충전 내역 (충전 건별 취소 가능 금액 포함)
// 필요한 응답: { cancelableTotal, content: [{ chargeId, amount, cancelledAmount, cancelableAmount, status, approvedAt }] }
// status: PENDING | APPROVED | CANCEL_PENDING | REVIEW_REQUIRED
export function getCharges(params = {}) {
  return client.get('/api/v1/wallet/charges', { params });
}

// TODO: 충전 취소 (금액은 서버가 정함: min(남은 취소 가능 금액, 지금 충전금), 부분 취소 가능)
// 필요한 응답: { chargeId, cancelledAmount(이번에 취소된 금액), usedAmount, balanceAfter }
export function cancelCharge(chargeId) {
  return client.post(`/api/v1/wallet/charges/${chargeId}/cancel`);
}
