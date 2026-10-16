import client from './client';

// 예치금 잔액 → { balance }
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

// 토스 결제 성공 후 승인 → { chargeId, amount, balanceAfter, ... }
export function confirmCharge(chargeId, { paymentKey, orderId, amount }) {
  return client.post(`/api/v1/wallet/charges/${chargeId}/confirm`, { paymentKey, orderId, amount });
}
