import client from './client';

// 관리자 API (ADMIN 권한)
// 근거: BE docs/flows/image-review.md 「관리자 수동 검수」, AdminImageReviewController
// 응답 → 화면 props 매핑은 pages/admin/adminReviewMapper.js

// 관리자 확인 대기 목록 (오래된 순, status는 MANUAL만). 응답 PagingResponse<AdminImageReviewResponse>:
// { content: [{ reviewId, productId, reviewVersion, sellerId, sellerNickname, title, description, price, imageUrls,
//               speciesId, speciesName, speciesScientificName, otherSpecies, scope, manualReason, detail,
//               engineResult: { moderation: { imageFlagged, textFlagged } | null,
//                               plant: { plant, saleForm, candidates: [{ scientificName, koreanName, confidence }] } | null } | null,
//               rejectReason, appealMemo, appealedAt, requestedAt, reviewedAt, expiresAt, delayed }],
//   page, size, totalElements, totalPages }
// BE에 단건 상세 API가 없어, 상세 화면도 이 목록에서 reviewId로 찾아 씀
export function getManualImageReviews({ page = 0, size = 100 } = {}) {
  return client.get('/api/v1/admin/imageReviews', { params: { status: 'MANUAL', page, size } });
}

// 관리자 검수 처리 (BE AdminReviewDecisionRequest)
// body = { decision: 'APPROVED' | 'REJECTED', rejectReason, memo }
// 반려는 rejectReason 필수, OTHER면 memo 필수(200자). 409 REVIEW_ALREADY_PROCESSED · REVIEW_OUTDATED
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
