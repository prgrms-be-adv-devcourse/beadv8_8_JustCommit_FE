import client from './client';

// 장바구니 항목으로 주문 생성 + 예치금 결제 (서버가 주문 저장·상품 예약·결제를 한 번에 처리)
// form = { cartItemIds, recipientName, recipientPhone, zipcode, address1, address2 }
// → { orderId, orderNo, totalAmount, itemCount, status, expiresAt, createdAt }
// status: PAID(결제 완료) | PAYMENT_PENDING(잔액 부족으로 결제 대기, 상품은 잠시 예약됨)
export function createCartOrder(form) {
  return client.post('/api/v1/orders/cart', form);
}

// 구매자 주문 목록 (최신순) params = { page, size }
// → { content: [{ orderId, orderNo, totalAmount, itemCount, status, representativeItemName, createdAt }], page, size, totalElements, totalPages }
// 주문 API는 ApiResponse로 감싸지 않고 DTO를 그대로 반환
export function getOrders(params) {
  return client.get('/api/v1/orders', { params });
}

// 주문 상세 → { orderId, orderNo, totalAmount, itemCount, status, createdAt, recipient…, sellerOrders[] }
// sellerOrders[] = { id, sellerId, items[], totalAmount, shippingFee, shipmentId, shipmentStatus,
//                    bookedAt?, pickedUpAt?, inTransitAt?, deliveredAt, confirmedAt } (? = 백엔드 추가 예정)
// items[] = { id, productId, productName, price, status, purchaseConfirmable }
export function getOrder(orderId) {
  return client.get(`/api/v1/orders/${orderId}`);
}

// 주문 상품 하나 취소 (택배 수거 전까지만 가능, 예치금 환불)
export function cancelOrderItem(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/cancel`);
}

// 주문 상품 구매 확정 (배송 완료 후, 판매자 정산이 시작됨)
export function confirmOrderItem(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/confirm`);
}
