// 판매자 1명당 배송비 (백엔드 OrderService와 같은 값, 세미 기본 배송비)
// TODO: 배송비 정책이 확정되면 백엔드 응답 값으로 교체
export const SHIPPING_FEE_PER_SELLER = 3000;

// 주문 상태 (백엔드 OrderStatus)
// tone: 배지 색 / muted: 목록에서 흐리게 보여 줄 끝난 주문
export const ORDER_STATUS = {
  PAYMENT_PENDING: { label: '결제 대기', tone: 'pending' },
  PAID: { label: '결제 완료', tone: 'paid' },
  COMPLETED: { label: '거래 완료', tone: 'completed' },
  CANCELLED: { label: '주문 취소', tone: 'closed', muted: true },
  EXPIRED: { label: '결제 시간 만료', tone: 'closed', muted: true },
  PAYMENT_FAILED: { label: '결제 실패', tone: 'closed', muted: true },
};

// 주문 상품 상태 (백엔드 OrderItemStatus). NORMAL은 배송 상태로 표시
export const ORDER_ITEM_STATUS = {
  CANCELLED: { label: '취소됨', tone: 'closed', muted: true },
  REFUND_REQUESTED: { label: '환불 요청', tone: 'pending' },
  REFUNDED: { label: '환불 완료', tone: 'closed', muted: true },
  CONFIRMED: { label: '구매 확정', tone: 'completed' },
};

// 배송 상태 (백엔드 ShipmentStatus) → 배지 이름과 배송 단계(1~4)
export const SHIPMENT_STATUS = {
  READY: { label: '배송 준비', tone: 'paid', step: 1 },
  BOOKED: { label: '택배 예약', tone: 'paid', step: 1 },
  PICKED_UP: { label: '접수 완료', tone: 'paid', step: 2 },
  IN_TRANSIT: { label: '배송 중', tone: 'paid', step: 3 },
  DELIVERED: { label: '배송 완료', tone: 'completed', step: 4 },
  CANCELLED: { label: '접수 취소', tone: 'closed', step: 0 },
};

export const SHIPMENT_STEPS = [
  { label: '택배 예약', icon: 'inventory_2' },
  { label: '접수 완료', icon: 'package_2' },
  { label: '배송 중', icon: 'local_shipping' },
  { label: '배송 완료', icon: 'home' },
];

// 택배 수거 전 상태: 이때만 상품 취소 가능 (백엔드 SHIPMENT_NOT_CANCELABLE 규칙)
export const CANCELABLE_SHIPMENT_STATUSES = ['READY', 'BOOKED'];

// 배송 완료 후 자동 구매 확정까지 걸리는 날 (백엔드 자동 구매 확정 스케줄러)
export const AUTO_CONFIRM_DAYS = 3;
