import client from './client';

// 판매자 리뷰 목록 (BE #583). 비회원도 조회. 최신순, 응답 data = PagingResponse
// { content: [{ reviewId, rating, content, tags, createdAt, writerNickname, productNames }], page, size, totalElements, totalPages }
export function getSellerReviews(sellerId, { page, size } = {}) {
  return client.get('/api/v1/reviews', { params: { sellerId, page, size } });
}

// 판매자 리뷰 집계 (BE #583). 비회원도 조회
// data = { averageRating(리뷰가 없으면 null), reviewCount, ratingCounts: [{ rating, count }], tagCounts: [{ tag, count }] }
export function getSellerReviewSummary(sellerId) {
  return client.get('/api/v1/reviews/summary', { params: { sellerId } });
}

// 주문 상세의 판매자별 리뷰 상태 (BE #644). 구매자 본인의 주문만 (없는 주문 · 남의 주문은 404 REVIEW_ORDER_NOT_FOUND)
// data = { orderId, summary: { targetCount, writtenCount, writableCount, nextWritable }, sellerOrders: [...] }
// sellerOrders[] = { sellerOrderId, sellerId, sellerNickname, productNames, confirmedAt, writableUntil, reviewStatus, review }
// reviewStatus: DELETED · WRITTEN · NO_CONFIRMED_ITEM · NOT_CONFIRMED · EXPIRED · WRITABLE
export function getOrderReviewStatus(orderId) {
  return client.get(`/api/v1/reviews/orders/${orderId}`);
}

// 리뷰 작성 (BE #582). 성공 201 data = { reviewId }
// 409: REVIEW_ALREADY_WRITTEN · REVIEW_PERIOD_EXPIRED · REVIEW_NOT_CONFIRMED · REVIEW_NO_CONFIRMED_ITEM
export function createReview({ sellerOrderId, rating, content, tags }) {
  return client.post('/api/v1/reviews', { sellerOrderId, rating, content, tags });
}

// 내 리뷰 목록 (BE #584). 최신순, 응답 data = PagingResponse
// content[] = { reviewId, sellerId, sellerNickname, orderId, orderedAt, rating, content, tags, productNames, createdAt, deletableUntil }
export function getMyReviews({ page, size } = {}) {
  return client.get('/api/v1/reviews/me', { params: { page, size } });
}

// 작성 가능한 주문 목록 (BE #585). 페이지 없이 배열, 작성 마감이 가까운 순
// data[] = { sellerOrderId, orderId, sellerId, sellerNickname, orderedAt, confirmedAt, writableUntil, productNames }
export function getWritableReviews() {
  return client.get('/api/v1/reviews/writable');
}

// 리뷰 삭제 (BE #584). 작성 후 72시간 안에만. 404 REVIEW_NOT_FOUND · 409 REVIEW_DELETE_PERIOD_EXPIRED
export function deleteReview(reviewId) {
  return client.delete(`/api/v1/reviews/${reviewId}`);
}
