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
