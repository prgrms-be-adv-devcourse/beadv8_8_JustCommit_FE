import client from './client';

// 관리자 API (ADMIN 권한)
// 근거: BE docs/flows/image-review.md 「관리자 수동 검수」, BE AdminImageReviewController

// 관리자 확인 대기 목록 (오래된 순, 페이지)
// → PagingResponse { content: [AdminImageReviewResponse], page, size, totalElements, totalPages }
// AdminImageReviewResponse: { reviewId, productId, reviewVersion, sellerId, sellerNickname, title, description, price,
//   imageUrls[], speciesId, speciesName, speciesScientificName, otherSpecies, scope, manualReason, detail,
//   engineResult: { moderation: { imageFlagged, textFlagged } | null,
//                   plant: { plant, saleForm, candidates: [{ scientificName, koreanName, confidence }] } | null } | null,
//   rejectReason, appealMemo, appealedAt, requestedAt, reviewedAt, expiresAt, delayed }
// 화면 모양으로 바꾸는 곳: pages/admin/imageReviewModel.js
// 한 건 상세 API는 없음 → 상세 화면도 이 목록에서 reviewId로 찾음 (목록 항목에 상세 필드가 다 있음)
export function getManualImageReviews({ page = 0, size = 100 } = {}) {
  return client.get('/api/v1/admin/imageReviews', { params: { status: 'MANUAL', page, size } });
}

// 관리자 처리 body = { decision: 'APPROVED' | 'REJECTED', rejectReason, memo }
// 반려면 rejectReason 필수, OTHER면 memo 필수(200자). 409: 이미 처리됐거나 판매자가 수정 · 삭제함
export function decideImageReview(reviewId, body) {
  return client.patch(`/api/v1/admin/imageReviews/${reviewId}`, body);
}

// 수수료 · 배송비 리포트
// TODO: docs에 경로 없음 (제안: GET /api/v1/admin/reports/fees?period=TODAY|WEEK|MONTH). 화면이 쓰는 모양:
// { from, to, tradeAmount, returnCount, settledSellerCount, tradeCount, averagePayout, returnRate,
//   daily: [{ date, settlementCount, fee, sellerBurden, shippingCollected, shippingRefunded }] }
// 수수료 · 판매자 부담금 · 배송비 합계는 daily를 더해서 화면이 계산합니다.
export function getFeeReport(params) {
  return client.get('/api/v1/admin/reports/fees', { params });
}
