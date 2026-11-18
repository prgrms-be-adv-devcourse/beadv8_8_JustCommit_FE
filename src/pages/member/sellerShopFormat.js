// 판매자 상점 화면(상점 · 리뷰 전체) 데이터 모양 맞추기

// GET sellers/{sellerId} 응답 + 리뷰 요약 → SellerShopBar의 seller
export function toShopSeller(seller, reviews) {
  return {
    nickname: seller.nickname,
    // 리뷰 0개면 별점 자리에 「아직 리뷰 없음」 (시안 02-4-7)
    noReviews: reviews.totalCount === 0,
    // TODO: 평균 별점 · 리뷰 수 API 없음 (리뷰 API docs ⬜)
    ratingText: reviews.averageRating == null ? '{평균 별점}' : reviews.averageRating.toFixed(1),
    reviewCountText: reviews.totalCount == null ? '{리뷰 수}' : reviews.totalCount.toLocaleString('ko-KR'),
    // TODO: 판매 완료 수가 GET sellers/{sellerId} 응답에 없음 → soldCount 필드 요청
    soldCountText: seller.soldCount == null ? '{판매 완료 수}' : seller.soldCount.toLocaleString('ko-KR'),
  };
}
