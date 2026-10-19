// 알림 종류 (백엔드 NotificationType). 문구는 서버가 message로 완성해서 준다
// kind: 위쪽 작은 분류 / icon: Material Symbols / to: 누르면 이동할 곳
// TODO: 알림 응답에 orderId가 생기면 구매자 알림은 주문 상세(/orders/:orderId)로 바로 이동
export const NOTIFICATION_TYPE = {
  // 판매자
  SHIPMENT_BOOKED: { kind: '판매', icon: 'inventory_2', to: '/orders/seller' },
  PURCHASE_CONFIRMED: { kind: '판매', icon: 'verified', to: '/orders/seller' },
  // 구매자
  SHIPMENT_PICKED_UP: { kind: '배송', icon: 'package_2', to: '/orders' },
  SHIPMENT_IN_TRANSIT: { kind: '배송', icon: 'local_shipping', to: '/orders' },
  SHIPMENT_DELIVERED: { kind: '배송', icon: 'home', to: '/orders' },
};

export const DEFAULT_NOTIFICATION_TYPE = { kind: '알림', icon: 'notifications', to: null };

// 헤더 배지의 안 읽은 수를 다시 조회하는 간격 (실시간 SSE 연결 전 임시)
export const UNREAD_POLL_INTERVAL_MS = 30_000;
