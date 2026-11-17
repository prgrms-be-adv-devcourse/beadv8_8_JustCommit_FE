import client from './client';

// 장바구니 항목으로 주문 생성 + 예치금 결제 (서버가 주문 저장·상품 예약·결제를 한 번에 처리)
// form = { cartItemIds, recipientName, recipientPhone, zipcode, address1, address2 }
// → { orderId, orderNo, totalAmount, itemCount, status, expiresAt, createdAt }
// status: PAID(결제 완료) | PAYMENT_PENDING(잔액 부족으로 결제 대기, 상품은 잠시 예약됨)
export function createCartOrder(form) {
  return client.post('/api/v1/orders/cart', form);
}

// 구매자 주문 목록 (최신순) params = { page, size }
// → { content: [{ orderId, orderNo, totalAmount, itemCount, status, representativeItemName, thumbnailUrl, createdAt }], page, size, totalElements, totalPages }
// 주문 API는 ApiResponse로 감싸지 않고 DTO를 그대로 반환
export function getOrders(params) {
  return client.get('/api/v1/orders', { params });
}

// 주문 상세 → { orderId, orderNo, totalAmount, itemCount, status, createdAt, recipient…, sellerOrders[] }
// sellerOrders[] = { id, sellerId, items[], totalAmount, shippingFee, shipmentId, shipmentStatus,
//                    bookedAt?, pickedUpAt?, inTransitAt?, deliveredAt, confirmedAt } (? = 백엔드 추가 예정)
// items[] = { id, productId, productName, price, status, purchaseConfirmable, thumbnailUrl }
export function getOrder(orderId) {
  return client.get(`/api/v1/orders/${orderId}`);
}

// 판매 주문 목록 (최근 주문 순) params = { page, size }
// → { content: [{ sellerOrderId, orderId, orderNo, totalAmount, itemCount, status, representativeItemName, thumbnailUrl, createdAt }], totalPages, … }
// totalAmount는 상품 금액 + 배송비
export function getSellerOrders(params) {
  return client.get('/api/v1/orders/seller', { params });
}

// 판매 주문 상세 → { sellerOrderId, orderNo, totalAmount, shippingFee, status, createdAt, recipient…, items[] }
export function getSellerOrder(sellerOrderId) {
  return client.get(`/api/v1/orders/seller/${sellerOrderId}`);
}

// 주문 상품 하나 취소 (택배 수거 전까지만 가능, 예치금 환불)
export function cancelOrderItem(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/cancel`);
}

// 주문 상품 구매 확정 (배송 완료 후, 판매자 정산이 시작됨)
export function confirmOrderItem(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/confirm`);
}

// 결제 대기(PAYMENT_PENDING) 주문을 예치금으로 결제 (충전 화면에서 충전이 끝난 뒤 자동 호출)
// TODO: docs/reference/external-apis.md의 POST orders/{id}/pay. 응답 형식은 백엔드 확정 후 맞춤
export function payOrder(orderId) {
  return client.post(`/api/v1/orders/${orderId}/pay`);
}

// TODO: 백엔드 API가 아직 없음 (docs/reference/external-apis.md 「추가 예정」 · market)
// 경로 · 요청 형식은 담당이 확정하면 맞춥니다. 버튼을 누르면 부르고, API가 없으면 실패 안내가 보입니다.

// 판매자 수락 · 거절: 체크한 주문상품만 거절(사유 없음), 나머지는 수락
export function respondSellerOrder(sellerOrderId, rejectedOrderItemIds) {
  return client.post(`/api/v1/orders/seller/${sellerOrderId}/accept`, { rejectedOrderItemIds });
}

// 반품 승인 · 거절 (판매자)
export function approveReturn(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/return/approve`);
}

export function rejectReturn(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/return/reject`);
}

// TODO: 반품 신청 API (BE docs/services/market.md 「⬜ 반품 신청」, 경로 · 본문 미정)
// form = { reason: 'DAMAGED' | 'NOT_AS_DESCRIBED' | 'OTHER', detail } (사유 이름도 백엔드 확정 후 맞춤)
export function requestReturn(orderItemId, form) {
  return client.post(`/api/v1/orders/items/${orderItemId}/return`, form);
}

// TODO: 배송 조회 API (택배 이벤트 목록, 경로 미정). 생기기 전까지 화면은 자리 문구를 씀
// → { trackingNo, events: [{ occurredAt, status, location }] } (최신순)
export function getShipmentTracking(shipmentId) {
  return client.get(`/api/v1/shipments/${shipmentId}/tracking`);
}
