import { REVIEW_WRITE_DAYS } from '../../constants/review';
import { formatDate } from '../../utils/format';

// 리뷰 화면 날짜 · 데이터 모양 맞추기

const DAY_MS = 24 * 60 * 60 * 1000;

// "10월 19일"
export function formatMonthDay(value) {
  const date = new Date(value);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 구매 확정 시각 + 3일 = 리뷰 작성 마감
export function getWritableUntil(confirmedAt) {
  return new Date(new Date(confirmedAt).getTime() + REVIEW_WRITE_DAYS * DAY_MS);
}

export function isPast(value) {
  return new Date(value).getTime() <= Date.now();
}

// 리뷰 응답 → ReviewCard 모양
export function toReviewCard(review) {
  return {
    reviewId: review.reviewId,
    reviewerNickname: review.reviewerNickname ?? null, // null = 탈퇴한 회원
    rating: review.rating,
    dateText: formatDate(review.createdAt),
    tags: review.tags ?? [],
    content: review.content,
    productNames: review.productNames ?? [],
  };
}

// 주문 상세의 판매자 주문 → 리뷰 작성 화면의 판매자 한 줄
// TODO: 주문 상세 응답에 판매자 닉네임 · 리뷰 작성 여부가 없음 → sellerNickname · reviewed 필드 요청 필요 (리뷰 API docs ⬜)
export function toReviewSeller(sellerOrder) {
  const items = sellerOrder.items ?? [];
  const first = items[0]?.productName ?? '';
  const until = getWritableUntil(sellerOrder.confirmedAt);
  return {
    sellerOrderId: sellerOrder.id,
    sellerNickname: sellerOrder.sellerNickname ?? '{판매자 닉네임}',
    thumbnailUrl: items[0]?.thumbnailUrl ?? '',
    summary: items.length > 1 ? `${first} 외 ${items.length - 1}건` : first,
    written: Boolean(sellerOrder.reviewed ?? sellerOrder.reviewId),
    expired: isPast(until),
    untilText: formatMonthDay(until),
    confirmedDateText: formatDate(sellerOrder.confirmedAt),
    items: items.map((item) => ({ productName: item.productName, thumbnailUrl: item.thumbnailUrl })),
  };
}

// 이름 뒤 은/는 (받침이 있으면 은). 한글이 아니면 은(는)
export function withTopic(name) {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${name}은(는)`;
  return `${name}${code % 28 ? '은' : '는'}`;
}
