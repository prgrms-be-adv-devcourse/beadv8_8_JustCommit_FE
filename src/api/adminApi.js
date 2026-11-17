import client from './client';

// 관리자 API (ADMIN 권한)
// 근거: BE docs/flows/image-review.md 「관리자 수동 검수」, docs/reference/external-apis.md
// 응답 필드는 BE에서 아직 정하지 않아, 화면이 쓰는 모양(View props)을 제안 형태로 적어 둡니다.

// 수동 검수 대기 목록 (오래된 순) — 경로는 docs에 있음
// TODO: 응답 필드 확정 필요. 화면이 쓰는 모양:
// { pendingCount, overdueCount, appealCount,
//   reviews: [{ imageReviewId, waitedMinutes, remainingMinutes, productName, photoCount, price,
//               sellerNickname, selectedSpeciesName, reason: { type, text } }] }
export function getManualImageReviews() {
  return client.get('/api/v1/admin/imageReviews', { params: { status: 'MANUAL' } });
}

// 수동 검수 한 건 상세
// TODO: docs에 경로 없음 (제안: GET /api/v1/admin/imageReviews/{id}). 화면이 쓰는 모양:
// { imageReviewId, badges: [{ type, text }], productName, sellerNickname, price, reviewVersion,
//   waitedMinutes, remainingMinutes, photos: [url], appeal: { memo, createdAt } | null,
//   engine: { harmful, plant, saleForm, saleFormIsRejectReason, bannedSuspect },
//   selectedSpeciesName, candidates: [{ scientificName, koreanName, matchNote, percent }],
//   description, history: [{ time, text }], autoRejectReason }
export function getImageReview(imageReviewId) {
  return client.get(`/api/v1/admin/imageReviews/${imageReviewId}`);
}

// 수동 검수 결과 — 경로는 docs에 있음
// TODO: 요청 본문 확정 필요 (제안: { result: 'APPROVED' | 'REJECTED', reasonCode, reasonText })
export function decideImageReview(imageReviewId, body) {
  return client.patch(`/api/v1/admin/imageReviews/${imageReviewId}`, body);
}

// 수수료 · 배송비 리포트
// TODO: docs에 경로 없음 (제안: GET /api/v1/admin/reports/fees?period=TODAY|WEEK|MONTH). 화면이 쓰는 모양:
// { from, to, tradeAmount, returnCount, settledSellerCount, tradeCount, averagePayout, returnRate,
//   daily: [{ date, settlementCount, fee, sellerBurden, shippingCollected, shippingRefunded }] }
// 수수료 · 판매자 부담금 · 배송비 합계는 daily를 더해서 화면이 계산합니다.
export function getFeeReport(params) {
  return client.get('/api/v1/admin/reports/fees', { params });
}
