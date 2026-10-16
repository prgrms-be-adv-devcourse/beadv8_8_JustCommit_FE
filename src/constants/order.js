// 판매자 1명당 배송비 (백엔드 OrderService와 같은 값, 세미 기본 배송비)
// TODO: 배송비 정책이 확정되면 백엔드 응답 값으로 교체
export const SHIPPING_FEE_PER_SELLER = 3000;

// 판매 주문 배송 상태 (시안 11-F 탭·배지 순서)
export const SALES_STATUS = {
  PREPARING: { label: '배송 준비', tone: 'preparing' },
  SHIPPING: { label: '배송 중', tone: 'shipping' },
  DELIVERED: { label: '배송 완료', tone: 'delivered' },
  CONFIRMED: { label: '구매 확정', tone: 'confirmed' },
  CANCELLED: { label: '주문 취소', tone: 'cancelled' },
};

// 백엔드 SettlementPolicy.FEE_RATE (판매 금액의 5%, 원 단위 버림)
export const SETTLEMENT_FEE_RATE = 0.05;

/**
 * 판매 주문의 배송 상태 키(SALES_STATUS)를 계산
 * TODO: 백엔드 판매 주문 응답에 shipmentStatus가 생기면 배송 중·배송 완료가 정확해짐
 *       지금은 주문 상태(PAID·COMPLETED·CANCELLED)와 상품 상태로만 판단
 */
export function getSalesStatus(order) {
  if (order.status === 'CANCELLED') return 'CANCELLED';
  if (order.status === 'COMPLETED') return 'CONFIRMED';

  // 상세 응답에만 items가 있음: 취소 안 된 상품이 모두 구매 확정이면 구매 확정
  const liveItems = (order.items ?? []).filter((item) => item.status !== 'CANCELLED');
  if (liveItems.length > 0 && liveItems.every((item) => item.status === 'CONFIRMED')) {
    return 'CONFIRMED';
  }

  switch (order.shipmentStatus) {
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      return 'SHIPPING';
    case 'DELIVERED':
      return 'DELIVERED';
    default:
      return 'PREPARING';
  }
}
