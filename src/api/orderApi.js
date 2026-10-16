import client from './client';

// 장바구니 항목으로 주문 생성 + 예치금 결제 (서버가 주문 저장·상품 예약·결제를 한 번에 처리)
// form = { cartItemIds, recipientName, recipientPhone, zipcode, address1, address2 }
// → { orderId, orderNo, totalAmount, itemCount, status, expiresAt, createdAt }
// status: PAID(결제 완료) | PAYMENT_PENDING(잔액 부족으로 결제 대기, 상품은 잠시 예약됨)
export function createCartOrder(form) {
  return client.post('/api/v1/orders/cart', form);
}

// 주문 상세 → { orderId, orderNo, totalAmount, itemCount, status, recipient…, sellerOrders[] }
export function getOrder(orderId) {
  return client.get(`/api/v1/orders/${orderId}`);
}

// 판매 주문 목록 (최근 주문 순) params = { page, size }
// → { content: [{ sellerOrderId, orderId, orderNo, totalAmount, itemCount, status, representativeItemName, createdAt }], totalPages, … }
// totalAmount는 상품 금액 + 배송비
export function getSellerOrders(params) {
  return client.get('/api/v1/orders/seller', { params });
}

// 판매 주문 상세 → { sellerOrderId, orderNo, totalAmount, shippingFee, status, createdAt, recipient…, items[] }
export function getSellerOrder(sellerOrderId) {
  return client.get(`/api/v1/orders/seller/${sellerOrderId}`);
}
