import client from './client';

// 내 정산 내역 → [{ settlementId, sellerOrderId, date(지급 전 null), status(COMPLETED · PENDING), productName, saleAmount, fee, payoutAmount }]
export function getMySettlements() {
  return client.get('/api/v1/settlements');
}
