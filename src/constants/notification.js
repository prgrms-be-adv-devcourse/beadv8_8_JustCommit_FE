// 알림 종류 (백엔드 NotificationType). 문구는 서버가 message로 완성해서 준다
// kind: 위쪽 작은 분류 / icon: Material Symbols / role: 누구에게 가는 알림인지 (누르면 이동할 곳을 정함)
export const NOTIFICATION_TYPE = {
  // 판매자
  SELLER_ORDER_PAID: { kind: '주문', icon: 'shopping_bag', role: 'seller' },
  SELLER_ORDER_CANCELLED: { kind: '주문', icon: 'cancel', role: 'seller' },
  SHIPMENT_BOOKED: { kind: '배송', icon: 'inventory_2', role: 'seller' },
  SELLER_SHIPMENT_PICKED_UP: { kind: '배송', icon: 'package_2', role: 'seller' },
  SELLER_SHIPMENT_IN_TRANSIT: { kind: '배송', icon: 'local_shipping', role: 'seller' },
  SELLER_SHIPMENT_DELIVERED: { kind: '배송', icon: 'home', role: 'seller' },
  PURCHASE_CONFIRMED: { kind: '정산', icon: 'verified', role: 'seller' },
  // 구매자
  SHIPMENT_PICKED_UP: { kind: '배송', icon: 'package_2', role: 'buyer' },
  SHIPMENT_IN_TRANSIT: { kind: '배송', icon: 'local_shipping', role: 'buyer' },
  SHIPMENT_DELIVERED: { kind: '배송', icon: 'home', role: 'buyer' },
  SELLER_ORDER_CANCELLED_BUYER: { kind: '주문', icon: 'cancel', role: 'buyer' },
  ORDER_ITEM_AUTO_CONFIRMED: { kind: '구매 확정', icon: 'verified', role: 'buyer' },
};

export const DEFAULT_NOTIFICATION_TYPE = { kind: '알림', icon: 'notifications', role: null };

// 알림을 누르면 이동할 곳
// - 구매자: orderId가 있으면 주문 상세, 없으면(이전에 만든 알림) 주문 내역
// - 판매자: 판매 주문 (TODO: 판매 주문 상세 화면이 생기면 /orders/seller/{sellerOrderId}로 이동)
export function getNotificationTarget(item) {
  const { role } = NOTIFICATION_TYPE[item.type] ?? DEFAULT_NOTIFICATION_TYPE;
  if (role === 'buyer') return item.orderId ? `/orders/${item.orderId}` : '/orders';
  if (role === 'seller') return '/orders/seller';
  return null;
}

// 헤더 배지의 안 읽은 수를 다시 조회하는 간격 (실시간 SSE 연결 전 임시)
export const UNREAD_POLL_INTERVAL_MS = 30_000;
