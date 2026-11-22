import { getSellerOrder } from '../../api/orderApi';
import { getMySettlements } from '../../api/settlementApi';
import { SETTLEMENT_STATUS } from '../../constants/seller';
import { formatPrice } from '../../utils/format';
import { EMPTY } from '../../constants/emptyText';

// "2026-10-15" → "2026.10.15". 지급 전(PENDING) 정산은 BE가 date를 null로 줘서 "-"
export function formatSettlementDate(value) {
  if (!value) return '-';
  return value.slice(0, 10).replaceAll('-', '.');
}

// 0이면 "-", 아니면 "−2,400원" (정산 표의 빼는 금액)
export function minusText(amount) {
  return amount > 0 ? `−${formatPrice(amount)}` : '-';
}

// 음수면 다른 차감 칸과 같은 유니코드 마이너스로 "−6,000원" (음수 정산: 판매자 부담금이 판매액보다 큰 경우)
export function signedPriceText(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return formatPrice(amount);
  return value < 0 ? `−${formatPrice(-value)}` : formatPrice(value);
}

// 판매자 부담금: BE 응답에 따로 없어서 정산금 = 판매액 − 수수료 − 부담금(BE Settlement)으로 거꾸로 계산
// 예) 일부 반품 20,000 − 1,000 − 16,000 = 3,000 / 전부 반품 0 − 0 − (−6,000) = 6,000
export function sellerBurdenOf(item) {
  if (item.sellerBurden != null) return Number(item.sellerBurden) || 0;
  const sale = Number(item.saleAmount);
  const fee = Number(item.fee);
  const payout = Number(item.payoutAmount);
  if (![sale, fee, payout].every(Number.isFinite)) return 0;
  return Math.max(0, sale - fee - payout);
}

// 정산 응답에는 주문번호가 없어 판매 주문 상세(GET /api/v1/orders/seller/{sellerOrderId})의 orderNo로 채움
// 같은 판매 주문은 한 번만 부르고, 실패하면 주문번호는 「-」
async function loadOrderNos(settlements) {
  const ids = [...new Set(settlements.map((item) => item.sellerOrderId).filter((id) => id != null))];
  const results = await Promise.allSettled(ids.map((id) => getSellerOrder(id)));
  const orderNos = new Map();
  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    const detail = result.value.data.data ?? result.value.data;
    if (detail?.orderNo) orderNos.set(ids[index], detail.orderNo);
  });
  return orderNos;
}

export async function fetchSettlements() {
  const response = await getMySettlements();
  const settlements = response.data.data ?? [];
  const orderNos = await loadOrderNos(settlements);
  return settlements.map((item) =>
    item.orderNo || !orderNos.has(item.sellerOrderId) ? item : { ...item, orderNo: orderNos.get(item.sellerOrderId) },
  );
}

// 정산 응답 → 표 한 줄
// status는 BE가 COMPLETED · PENDING만 줌 (FAILED는 재시도 중이라 PENDING으로 옴)
// 주문번호(orderNo)는 fetchSettlements가 판매 주문 상세로 채움
// 판매자 부담금은 sellerBurdenOf로 계산 (응답에 sellerBurden이 생기면 그 값을 씀)
// TODO: 상품 수(itemCount) · 반품 수(returnedCount) · 취소 수(cancelledCount)가
//       응답에 생기면 그대로 쓰임
export function toSettlementRow(item) {
  const sellerBurden = sellerBurdenOf(item);
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
    date: item.date ?? null, // 지급 완료일. 지급 전이면 null
    dateText: formatSettlementDate(item.date),
    orderNo: item.orderNo ?? EMPTY,
    productName: name,
    badge,
    rowTone,
    saleText: formatPrice(item.saleAmount),
    feeText: minusText(item.fee),
    burdenText: minusText(sellerBurden),
    payoutText: signedPriceText(item.payoutAmount),
    status,
    statusKey: item.status ?? 'COMPLETED',
    saleAmount: item.saleAmount,
    fee: item.fee,
    sellerBurden,
    payoutAmount: item.payoutAmount,
  };
}

