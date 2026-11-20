import client from './client';

// 장바구니 항목으로 주문 생성 + 예치금 결제 (서버가 주문 저장·상품 예약·결제를 한 번에 처리)
// form = { cartItemIds, recipientName, recipientPhone, zipcode, address1, address2, expectedShippingFee }
// → { orderId, orderNo, totalAmount, itemCount, status, expiresAt, createdAt }
// status: PAID(결제 완료) | PAYMENT_PENDING(잔액 부족으로 결제 대기 10분, 상품은 잠시 예약됨)
// 실패: SHIPPING_FEE_CHANGED(서버가 배송지로 계산한 배송비가 expectedShippingFee와 다름)
//       409 PRICE_CHANGED(주문서 가격과 지금 가격이 다름) · 409 그 밖의 구매 불가
// TODO: 주문서 가격(상품별 expectedPrice)을 보내는 필드 이름이 정해지면 form에 추가 (BE docs/flows/order-payment.md)
// TODO: SHIPPING_FEE_CHANGED 응답에 바뀐 배송비 · 지역이 들어오는지 확인 (지금은 data.shippingFee · data.regionLabel로 가정)
export function createCartOrder(form) {
  return client.post('/api/v1/orders/cart', form);
}

// 결제 대기 주문 결제 (충전한 뒤 이어서 결제)
// 실패: PAYMENT_WINDOW_EXPIRED(주문 시각부터 10분이 지남) · 잔액 부족(결제 대기 유지)
export function payOrder(orderId) {
  return client.post(`/api/v1/orders/${orderId}/pay`);
}

// TODO: 배송지별 배송비 계산 API가 아직 없음 (백엔드 docs에도 없음, 서버는 결제 때만 배송지로 계산).
//  생기면 { zipcode, sellerIds } → { sellers: [{ sellerId, fee, baseFee, extraFee }], regionLabel }처럼 받아
//  제주 · 도서산간 추가 요금을 주문서에 미리 보여 줍니다. 지금은 null(= 판매자별 기본 요금)을 돌려줍니다.
export function quoteShippingFee() {
  return Promise.resolve(null);
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

// 주문 상품 하나 취소 (택배 수거 전까지만 가능, 예치금 환불) → 200 본문 없음
// 바로 환불되거나, 택배 취소 결과를 기다려야 하면 주문상품이 CANCEL_PROCESSING이 됨 (BE ADR 0026)
// 실패 409: SHIPMENT_NOT_CANCELABLE(기사님 2km 안) · ORDER_ITEM_NOT_CANCELABLE · ORDER_NOT_PAID
export function cancelOrderItem(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/cancel`);
}

// 구매자 주문 전체 취소 (시안 03-5-3, 모든 판매자 주문의 남은 상품) → 200 본문 없음. 실패 코드는 상품 하나 취소와 같음
export function cancelOrder(orderId) {
  return client.post(`/api/v1/orders/${orderId}/cancel`);
}

// 주문 상품 구매 확정 (배송 완료 후, 판매자 정산이 시작됨) → 200 본문 없음
// 실패 409: SHIPMENT_NOT_DELIVERED · ORDER_ITEM_NOT_CONFIRMABLE
export function confirmOrderItem(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/confirm`);
}

// TODO: 백엔드 API가 아직 없음 (docs/reference/external-apis.md 「추가 예정」 · market)
// 경로 · 요청 형식은 담당이 확정하면 맞춥니다. 버튼을 누르면 부르고, API가 없으면 실패 안내가 보입니다.

// 판매자 수락 · 거절: 체크한 주문상품만 거절(사유 없음), 나머지는 수락
// senderAddressId: 보내는 주소로 고른 판매자 배송지 id (시안 08-5-2)
// TODO(market): BE docs/reference/external-apis.md에 수락 API 요청 필드가 아직 없음. 필드 이름 `senderAddressId`는 임시
export function respondSellerOrder(sellerOrderId, rejectedOrderItemIds, senderAddressId) {
  return client.post(`/api/v1/orders/seller/${sellerOrderId}/accept`, { rejectedOrderItemIds, senderAddressId });
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
