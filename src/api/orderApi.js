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

// 주문 상품 하나 취소 (택배 수거 전까지만 가능, 예치금 환불)
export function cancelOrderItem(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/cancel`);
}

// 주문 상품 구매 확정 (배송 완료 후, 판매자 정산이 시작됨)
export function confirmOrderItem(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/confirm`);
}
