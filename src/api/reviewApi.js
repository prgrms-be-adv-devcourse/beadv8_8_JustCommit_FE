import client from './client';

// 리뷰 API (market 서비스). BE docs/reference/external-apis.md에서 아직 ⬜ (경로 · 응답 미정)
// TODO: 백엔드 API가 정해지면 아래 자리 함수를 실제 호출로 바꿉니다.
//  - 조회 함수: 지금은 서버를 부르지 않고 빈 목록을 돌려줍니다 (화면은 빈 상태로 보임)
//  - 쓰기 함수: 임시 경로로 호출합니다 (API가 생기기 전에는 실패 → 화면에 실패 안내)

const EMPTY_PAGE = { content: [], totalElements: 0 };

// 내가 쓴 리뷰 → { content: [{ reviewId, sellerNickname, orderedAt, createdAt, rating, tags[], content,
//                               productNames[], deletableUntil, reviewerNickname }], totalElements }
// TODO: GET /api/v1/reviews/me (임시 이름)
export function getMyReviews() {
  return Promise.resolve({ data: EMPTY_PAGE });
}

// 쓸 수 있는 리뷰 (구매 확정 후 3일 안, 아직 안 쓴 판매자 주문)
// → { content: [{ orderId, sellerOrderId, sellerNickname, orderedAt, confirmedAt, writableUntil,
//                  items: [{ productName, thumbnailUrl }] }], totalElements }
// TODO: GET /api/v1/reviews/writable (임시 이름)
export function getWritableReviews() {
  return Promise.resolve({ data: EMPTY_PAGE });
}

// 받은 리뷰 (판매자) → { averageRating, totalCount, ratingCounts: [{ rating, count }],
//                      tagCounts: [{ tag, count }], content: [ ...리뷰 ] }
// TODO: GET /api/v1/sellers/{sellerId}/reviews 또는 /api/v1/reviews/received (임시 이름)
export function getReceivedReviews() {
  return Promise.resolve({
    data: { averageRating: 0, totalCount: 0, ratingCounts: [], tagCounts: [], ...EMPTY_PAGE },
  });
}

// 리뷰 작성 form = { sellerOrderId, rating, tags[], content }
// TODO: POST /api/v1/reviews (임시 경로)
export function createReview(form) {
  return client.post('/api/v1/reviews', form);
}

// 리뷰 삭제 (작성 후 3일 안, 소프트 삭제 · 다시 쓰기 불가)
// TODO: DELETE /api/v1/reviews/{reviewId} (임시 경로)
export function deleteReview(reviewId) {
  return client.delete(`/api/v1/reviews/${reviewId}`);
}

// 판매자 상점의 리뷰 요약 + 최근 리뷰 (시안 02-4-4 B안, 누구나 봄)
// → { averageRating, totalCount, content: [{ reviewId, reviewerNickname(null = 탈퇴), rating, createdAt, content, productNames[] }] }
// TODO: GET /api/v1/sellers/{sellerId}/reviews?size=3 (임시 이름). 지금은 서버를 부르지 않고 null 요약을 돌려줍니다
//  (화면은 평균 별점 · 리뷰 수에 자리 문구를 쓰고, 최근 리뷰는 비어 보임)
// eslint-disable-next-line no-unused-vars
export function getSellerReviews(sellerId, params = {}) {
  return Promise.resolve({ data: { averageRating: null, totalCount: null, ...EMPTY_PAGE } });
}
