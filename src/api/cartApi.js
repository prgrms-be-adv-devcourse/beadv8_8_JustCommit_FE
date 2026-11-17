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

// 장바구니 추천 (market이 ai-service를 불러 줌, 실패하면 서버가 최신 상품으로 대신)
// TODO: 응답 모양이 정해지면 확인. 지금은 상품 목록과 같은 [{ productId, title, price, thumbnailUrl, createdAt }]로 가정
export function getCartRecommendations() {
  return client.get('/api/v1/cart/recommendations');
}

// TODO: 바뀐 가격 확인 API가 아직 없음 (백엔드 docs에도 없음).
//  생기면 담을 때 가격(price)을 지금 가격(nowPrice)으로 맞추는 요청으로 바꿉니다.
//  지금은 서버에 저장하지 않고 화면에서만 확인한 것으로 처리합니다 (새로고침하면 다시 확인해야 함).
export function confirmCartItemPrice() {
  return Promise.resolve(null);
}
