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

// 장바구니 추천 (market이 ai-service를 불러 줌, ai가 느리거나 실패하면 빈 목록)
// → ApiResponse { data: [{ productId, title, price, thumbnailUrl, speciesName, reason, createdAt }] }
//   reason = 추천 이유, createdAt = 상품 등록 시각 (BE CartRecommendationResponse)
export function getCartRecommendations(size) {
  return client.get('/api/v1/cart/recommendations', { params: size ? { size } : undefined });
}

// 바뀐 가격 확인: 담을 때 가격(price)을 지금 가격으로 맞춤 (BE CartItemPriceUpdateRequest)
// items = [{ cartItemId, expectedPrice }] (expectedPrice = 구매자가 화면에서 확인한 지금 가격)
// → ApiResponse { data: CartResponse }. 그사이 가격이 또 바뀌면 409 PRICE_CHANGED, 살 수 없는 상품이면 PRODUCT_UNAVAILABLE
export function updateCartItemPrices(items) {
  return client.patch('/api/v1/cart/items/prices', { items });
}
