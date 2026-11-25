import { formatRating, getTagLabel } from '../../constants/review';
import { EMPTY } from '../../constants/emptyText';
import { formatDate } from '../../utils/format';

// 판매자 상점 화면(상점 · 리뷰 전체) 데이터 모양 맞추기

// 리뷰 집계의 tagCounts → 태그 칩 (많은 순, 0개인 태그 제외). 같은 개수면 백엔드 enum 순서 그대로
export function toTagChips(tagCounts) {
  return (tagCounts ?? [])
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((item) => ({ label: getTagLabel(item.tag), count: item.count }));
}

// GET sellers/{sellerId} 응답 + 리뷰 집계 + 판매 완료 수 → SellerShopBar의 seller
// summary: GET reviews/summary 응답 (null = 불러오지 못함 → 별점 · 리뷰 수 「-」)
// soldCount: GET products?sellerId&status=SOLD_OUT 응답의 totalElements (null = 모름 → 「-」)
export function toShopSeller(seller, summary, soldCount = null) {
  const reviewCount = summary?.reviewCount ?? null;
  return {
    nickname: seller.nickname,
    // 소개글 (GET sellers/{sellerId}의 intro, 비었으면 줄을 숨김)
    intro: seller.intro ?? '',
    // 리뷰 0개면 별점 자리에 「아직 리뷰 없음」, 1개 이상이면 「리뷰 전체 보기」로 갈 수 있음
    noReviews: reviewCount === 0,
    hasReviews: reviewCount > 0,
    ratingText: summary?.averageRating == null ? EMPTY : Number(summary.averageRating).toFixed(1),
    reviewCountText: reviewCount == null ? EMPTY : reviewCount.toLocaleString('ko-KR'),
    soldCountText: soldCount == null ? EMPTY : soldCount.toLocaleString('ko-KR'),
  };
}

// GET reviews 목록의 리뷰 하나 → 리뷰 카드 (시안 02-3-3)
export function toReviewCard(review) {
  const rating = Number(review.rating);
  return {
    key: review.reviewId,
    // 탈퇴 · 알 수 없는 회원도 백엔드가 닉네임 자리에 문구를 넣어 줌 (비어 오면 같은 문구로)
    nickname: review.writerNickname || '알 수 없는 회원',
    rating,
    ratingText: formatRating(rating),
    dateText: formatDate(review.createdAt),
    content: review.content,
    // 구매 확정된 주문상품 이름 (여러 개면 쉼표로). 비었으면 줄을 숨김
    productText: review.productNames?.length ? `구매 상품 · ${review.productNames.join(', ')}` : '',
  };
}
