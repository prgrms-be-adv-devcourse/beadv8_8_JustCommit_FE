import { EMPTY } from './emptyText';
// 리뷰 (BE docs/services/market.md 「정책」 리뷰 줄)
// 별점 0.5 ~ 5.0 (0.5 단위) · 글 10 ~ 300자 · 태그 5종(여러 개) · 사진 없음
// 수정 불가 · 작성 후 3일 안에만 삭제 · 구매 확정 후 3일 안에만 작성

export const REVIEW_CONTENT_MIN = 10;
export const REVIEW_CONTENT_MAX = 300;
export const REVIEW_WRITE_DAYS = 3; // 구매 확정 후 작성 가능 기간
export const REVIEW_DELETE_DAYS = 3; // 작성 후 삭제 가능 기간

// 태그 5종 (시안 05-2-1 순서). code는 백엔드 ReviewTag enum과 같음
export const REVIEW_TAGS = [
  { code: 'AS_DESCRIBED', label: '물품 상태가 설명과 같아요' },
  { code: 'DETAILED_DESCRIPTION', label: '설명이 자세해요' },
  { code: 'CAREFUL_PACKING', label: '포장이 꼼꼼해요' },
  { code: 'HEALTHY_ARRIVAL', label: '식물이 건강하게 도착했어요' },
  { code: 'GOOD_PRICE', label: '저렴하게 판매해요' },
];

export function getTagLabel(code) {
  return REVIEW_TAGS.find((tag) => tag.code === code)?.label ?? code;
}

// 별점 문구 (시안 05-3에 나온 값만. 3점 미만 문구는 시안에 없어 점수만)
const RATING_LABEL = { 5: '최고예요', 4.5: '아주 좋아요', 4: '좋아요', 3.5: '꽤 좋아요', 3: '괜찮아요' };

// 4.5 → "4.5점 · 아주 좋아요"
export function formatRating(rating) {
  if (!Number.isFinite(rating)) return EMPTY;
  const label = RATING_LABEL[rating];
  return label ? `${rating.toFixed(1)}점 · ${label}` : `${rating.toFixed(1)}점`;
}

// 별 하나의 채움 상태 (index: 0 ~ 4) → 'full' | 'half' | 'empty'
export function starFill(rating, index) {
  if (rating >= index + 1) return 'full';
  if (rating >= index + 0.5) return 'half';
  return 'empty';
}
