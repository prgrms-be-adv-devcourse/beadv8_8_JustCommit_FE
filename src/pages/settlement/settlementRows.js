import { getMySettlements } from '../../api/settlementApi';
import { SETTLEMENT_STATUS } from '../../constants/seller';
import { formatPrice } from '../../utils/format';

// "2026-10-15" → "2026.10.15"
export function formatSettlementDate(value) {
  return value.slice(0, 10).replaceAll('-', '.');
}

// 0이면 "—", 아니면 "−2,400원" (정산 표의 빼는 금액)
export function minusText(amount) {
  return amount > 0 ? `−${formatPrice(amount)}` : '—';
}

export async function fetchSettlements() {
  const response = await getMySettlements();
  return response.data.data ?? [];
}

// 정산 응답 → 표 한 줄
// TODO: 주문번호(orderNo) · 상태(status: PENDING · COMPLETED · FAILED) · 판매자 부담금(sellerBurden) ·
//       상품 수(itemCount) · 반품 수(returnedCount) · 취소 수(cancelledCount)가 응답에 생기면 그대로 쓰임
export function toSettlementRow(item) {
  const itemCount = item.itemCount ?? 1;
  const name = itemCount > 1 ? `${item.productName} 외 ${itemCount - 1}개` : item.productName;
  let badge = null;
  let rowTone = '';
  if (item.returnedCount > 0) {
    badge = { text: `${item.returnedCount}개 반품`, tone: 'bg-[#fffbeb] border border-[#fde68a] text-[#92400e]' };
    rowTone = 'bg-[#fffbeb]';
  } else if (item.cancelledCount > 0) {
    badge = { text: `${item.cancelledCount}개 취소`, tone: 'bg-[#f3f4f6] border border-[#e5e7eb] text-[#4b5563]' };
    rowTone = 'bg-[#f9fafb]';
  }
  const status = SETTLEMENT_STATUS[item.status ?? 'COMPLETED'] ?? SETTLEMENT_STATUS.COMPLETED;
  return {
    id: item.settlementId,
    date: item.date,
    dateText: formatSettlementDate(item.date),
    orderNo: item.orderNo ?? '{주문번호}',
    productName: name,
    badge,
    rowTone,
    saleText: formatPrice(item.saleAmount),
    feeText: minusText(item.fee),
    burdenText: minusText(item.sellerBurden ?? 0),
    payoutText: formatPrice(item.payoutAmount),
    status,
    statusKey: item.status ?? 'COMPLETED',
    saleAmount: item.saleAmount,
    fee: item.fee,
    sellerBurden: item.sellerBurden ?? 0,
    payoutAmount: item.payoutAmount,
  };
}

