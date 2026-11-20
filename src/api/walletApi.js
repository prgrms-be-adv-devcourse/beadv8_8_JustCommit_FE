import client from './client';

// 예치금 잔액 → { balance } (충전금 · 정산금을 나누지 않는 잔액 하나, 인출 한도 = 잔액 전체)
export async function getWalletBalance() {
  try {
    return await client.get('/api/v1/wallet');
  } catch (error) {
    // 지갑은 회원가입 이벤트로 만들어지므로, 이벤트 도입 전 가입자·전송 실패 회원은 지갑이 없을 수 있음
    // → 아직 충전한 적 없는 것과 같으니 잔액 0원으로 처리 (응답과 같은 모양으로 반환)
    if (error.response?.data?.code === 'WALLET_NOT_FOUND') {
      return { data: { data: { balance: 0 } } };
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

// 인출 신청 (예치금 잔액 안에서, 받는 계좌는 서버가 member에서 조회)
// Idempotency-Key 필수: 같은 키로 다시 보내면 처음 결과 (금액이 다르면 409 IDEMPOTENCY_KEY_CONFLICT)
// 응답: { cashOutId, amount, status, accountLast4, balanceAfter } (은행 이름 · 신청 시각 없음)
// status: PENDING | COMPLETED (지급 실패도 200 + PENDING)
export function requestCashOut(amount, idempotencyKey) {
  return client.post('/api/v1/wallet/cashOuts', { amount }, { headers: { 'Idempotency-Key': idempotencyKey } });
}

// 인출 내역 → Spring Page { content: [{ cashOutId, amount, status, accountLast4, requestedAt, completedAt }], ... }
// 기본 20건, 신청 시각 최신순. 지갑이 없으면 빈 목록
// TODO: 은행 이름(bankCode)이 응답에 없음 (화면은 내 등록 계좌와 끝 4자리가 같을 때만 은행 이름을 씀) · 이체 실패 상태는 #389에서 추가 예정
export function getCashOuts(params = {}) {
  return client.get('/api/v1/wallet/cashOuts', { params });
}

// ===== 아래는 백엔드 API가 아직 없는 기능 (docs/reference/external-apis.md 「추가 예정」 payment) =====
// 경로는 담당이 확정 전이라 임시로 적어 둠. 화면은 지금 이 함수 결과 대신 일반 문구를 보여 줌

// TODO: 충전 내역 (충전 취소는 하지 않기로 함). 지금 충전 내역 화면은 거래 내역(refType=CHARGE)으로 그림
// 필요한 응답: { content: [{ chargeId, amount, status, approvedAt }] }
export function getCharges(params = {}) {
  return client.get('/api/v1/wallet/charges', { params });
}

