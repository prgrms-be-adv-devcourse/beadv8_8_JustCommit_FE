import { getTagLabel } from '../../constants/review';

// 판매자 상점 화면(상점 · 리뷰 전체) 데이터 모양 맞추기

const TAG_CHIP_MAX = 5;

// 리뷰 요약의 tagCounts → 태그 칩 (많은 순, 최대 5개, 0개인 태그 제외)
// TODO: tagCounts는 리뷰 API(getSellerReviews) 응답에 있다고 가정한 임시 필드 (리뷰 API docs ⬜)
export function toTagChips(tagCounts) {
  return (tagCounts ?? [])
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, TAG_CHIP_MAX)
    .map((item) => ({ label: getTagLabel(item.tag), count: item.count }));
}

// GET sellers/{sellerId} 응답 + 리뷰 요약 + 판매 완료 수 → SellerShopBar의 seller
// soldCount: GET products?sellerId&status=SOLD_OUT 응답의 totalElements (BE 확정, null = 모름 → 자리 문구)
export function toShopSeller(seller, reviews, soldCount = null) {
  return {
    nickname: seller.nickname,
    // 소개글 (GET sellers/{sellerId}의 intro, 비었으면 줄을 숨김)
    intro: seller.intro ?? '',
    // 리뷰 0개면 별점 자리에 「아직 리뷰 없음」 (시안 02-3-4)
    noReviews: reviews.totalCount === 0,
    // TODO: 평균 별점 · 리뷰 수 API 없음 (리뷰 API docs ⬜)
    ratingText: reviews.averageRating == null ? '{평균 별점}' : reviews.averageRating.toFixed(1),
    reviewCountText: reviews.totalCount == null ? '{리뷰 수}' : reviews.totalCount.toLocaleString('ko-KR'),
    soldCountText: soldCount == null ? '{판매 완료 수}' : soldCount.toLocaleString('ko-KR'),
  };
}
