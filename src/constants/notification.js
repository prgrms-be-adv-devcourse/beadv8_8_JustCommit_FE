// 알림 종류 (백엔드 NotificationType). 문구는 서버가 message로 완성해서 준다
// kind: 위쪽 작은 분류 / icon: Material Symbols / role: 누구에게 가는 알림인지 (누르면 이동할 곳을 정함)
// badge: 시안 06-6-1 알림 목록 왼쪽 분류 배지 (판매 · 구매 · 검수 · 정산, 모양은 NOTIFICATION_BADGE_CLASS)
export const NOTIFICATION_TYPE = {
  // 판매자
  SELLER_ORDER_PAID: { kind: '주문', icon: 'shopping_bag', role: 'seller', badge: '판매' },
  SELLER_ORDER_CANCELLED: { kind: '주문', icon: 'cancel', role: 'seller', badge: '판매' },
  SELLER_ORDER_AUTO_REJECTED: { kind: '주문', icon: 'cancel', role: 'seller', badge: '판매' },
  SHIPMENT_BOOKED: { kind: '배송', icon: 'inventory_2', role: 'seller', badge: '판매' },
  SELLER_SHIPMENT_PICKED_UP: { kind: '배송', icon: 'package_2', role: 'seller', badge: '판매' },
  SELLER_SHIPMENT_IN_TRANSIT: { kind: '배송', icon: 'local_shipping', role: 'seller', badge: '판매' },
  SELLER_SHIPMENT_DELIVERED: { kind: '배송', icon: 'home', role: 'seller', badge: '판매' },
  PURCHASE_CONFIRMED: { kind: '정산', icon: 'verified', role: 'seller', badge: '정산' },
  // 구매자
  SHIPMENT_PICKED_UP: { kind: '배송', icon: 'package_2', role: 'buyer', badge: '구매' },
  SHIPMENT_IN_TRANSIT: { kind: '배송', icon: 'local_shipping', role: 'buyer', badge: '구매' },
  SHIPMENT_DELIVERED: { kind: '배송', icon: 'home', role: 'buyer', badge: '구매' },
  SELLER_ORDER_ACCEPTED: { kind: '주문', icon: 'check_circle', role: 'buyer', badge: '구매' },
  SELLER_ORDER_PARTLY_ACCEPTED: { kind: '주문', icon: 'check_circle', role: 'buyer', badge: '구매' },
  SELLER_ORDER_REJECTED: { kind: '주문', icon: 'cancel', role: 'buyer', badge: '구매' },
  SELLER_ORDER_AUTO_CANCELLED: { kind: '주문', icon: 'cancel', role: 'buyer', badge: '구매' },
  // 판매자 (상품 검수 반려) TODO: 백엔드 알림 type 이름이 정해지면 맞춤 (BE docs: ProductRejected 이벤트)
  PRODUCT_REJECTED: { kind: '검수', icon: 'block', role: 'product', badge: '검수' },
  ORDER_ITEM_AUTO_CONFIRMED: { kind: '구매 확정', icon: 'verified', role: 'buyer', badge: '구매' },
};

export const DEFAULT_NOTIFICATION_TYPE = { kind: '알림', icon: 'notifications', role: null, badge: '알림' };

// 분류 배지 모양 (시안 06-6-1)
export const NOTIFICATION_BADGE_CLASS = {
  판매: 'bg-[#0f4c3a] text-white',
  구매: 'bg-[#f4f8f6] border border-[#d1e7dd] text-[#0f4c3a]',
  검수: 'bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c]',
  정산: 'bg-[#f3f4f6] text-[#111827]',
  알림: 'bg-[#f3f4f6] text-[#111827]',
};

// 알림을 누르면 이동할 곳
// - 구매자: orderId가 있으면 주문 상세, 없으면(이전에 만든 알림) 주문 내역
// - 판매자: sellerOrderId가 있으면 판매 주문 상세, 없으면 판매 주문 목록
// - 검수 반려: 판매 상품 목록
export function getNotificationTarget(item) {
  const { role } = NOTIFICATION_TYPE[item.type] ?? DEFAULT_NOTIFICATION_TYPE;
  if (role === 'product') return '/mypage/products';
  if (role === 'buyer') return item.orderId ? `/orders/${item.orderId}` : '/orders';
  if (role === 'seller') {
    return item.sellerOrderId ? `/orders/seller/${item.sellerOrderId}` : '/orders/seller';
  }
  return null;
}
