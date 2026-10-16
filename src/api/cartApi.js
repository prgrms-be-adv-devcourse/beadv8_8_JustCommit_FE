import client from './client';

// 주의: 장바구니 API는 다른 API와 달리 ApiResponse로 감싸지 않음
// → 성공 데이터는 response.data.data가 아니라 response.data

// 장바구니 조회: { cartId, items[], totalAmount, nowTotalAmount }
export function getCart() {
  return client.get('/api/v1/cart');
}

// 담기: 성공 시 cartItemId(숫자)만 응답
export function addCartItem(productId) {
  return client.post('/api/v1/cart/items', { productId });
}

// 삭제: cartItemId가 아니라 productId로 지움
export function removeCartItem(productId) {
  return client.delete(`/api/v1/cart/items/${productId}`);
}
