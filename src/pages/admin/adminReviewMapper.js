import { MANUAL_REASON_BADGE, SALE_FORM_LABEL } from '../../constants/imageReview';
import { REVIEW_REJECT_REASON } from '../../constants/seller';

// 관리자 검수 API 응답(BE AdminImageReviewResponse) → AdminReviewsView · AdminReviewDetailView props
// BE에 없는 값은 null로 두어 View가 자리 문구를 보여 줌

const MINUTE_MS = 60 * 1000;

// 두 시각 사이 분 (음수면 0). BE LocalDateTime은 시간대 없이 오므로 브라우저 시간대로 읽음
function minutesBetween(from, to) {
  if (!from || !to) return null;
  return Math.max(0, Math.floor((new Date(to) - new Date(from)) / MINUTE_MS));
}

function timeOf(value) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function reasonBadge(item) {
  return MANUAL_REASON_BADGE[item.manualReason] ?? { type: 'DEFAULT', text: item.manualReason ?? '{확인할 이유}' };
}

// 목록 한 줄
function toListItem(item, now) {
  return {
    imageReviewId: item.reviewId,
    waitedMinutes: minutesBetween(item.reviewedAt, now),
    remainingMinutes: minutesBetween(now, item.expiresAt),
    productName: item.title,
    photoCount: item.imageUrls?.length ?? 0,
    price: Number(item.price),
    sellerNickname: item.sellerNickname,
    selectedSpeciesName: item.speciesName,
    reason: reasonBadge(item),
  };
}

// 목록 응답(PagingResponse) → AdminReviewsView data
// 12시간 넘은 수 · 이의 신청 수는 BE가 따로 주지 않아 받은 목록에서 셈. 한 페이지에 다 못 받으면 모름(null → 자리 문구)
// TODO: 전체 개수가 필요하면 BE 목록 응답에 집계 필드 추가 요청
export function toReviewList(page, now = new Date()) {
  const content = page?.content ?? [];
  const complete = (page?.totalPages ?? 0) <= 1;
  return {
    pendingCount: page?.totalElements ?? null,
    overdueCount: complete ? content.filter((item) => item.delayed).length : null,
    appealCount: complete ? content.filter((item) => item.manualReason === 'APPEAL').length : null,
    reviews: content.map((item) => toListItem(item, now)),
  };
}

function toEngine(item) {
  const result = item.engineResult;
  if (!result) return null;
  const { moderation, plant } = result;
  const saleForm = plant?.saleForm;
  let bannedSuspect = '없음';
  if (item.manualReason === 'BANNED_SUSPECTED') bannedSuspect = item.detail ?? MANUAL_REASON_BADGE.BANNED_SUSPECTED.text;
  return {
    harmful: moderation ? (moderation.imageFlagged || moderation.textFlagged ? '유해 의심' : '이상 없음') : null,
    plant: plant ? (plant.plant ? '식물' : '식물 아님') : null,
    saleForm: saleForm ? (SALE_FORM_LABEL[saleForm] ?? saleForm) : '{판매 형태}',
    saleFormIsRejectReason: Boolean(saleForm) && saleForm !== 'PLANT',
    bannedSuspect,
  };
}

// 검수 이력: BE가 주는 시각만으로 만듦 (검수 요청 · 이의 신청 · 관리자 확인으로 넘어옴)
function toHistory(item) {
  return [
    item.requestedAt && { at: item.requestedAt, text: `검수 요청 (버전 ${item.reviewVersion})` },
    item.appealedAt && { at: item.appealedAt, text: '판매자 이의 신청' },
    item.reviewedAt && !item.appealedAt && { at: item.reviewedAt, text: '관리자 확인으로 넘어옴' },
  ]
    .filter(Boolean)
    .sort((a, b) => new Date(a.at) - new Date(b.at))
    .map(({ at, text }) => ({ time: timeOf(at), text }));
}

// 목록 한 항목 → AdminReviewDetailView review
export function toReviewDetail(item, now = new Date()) {
  const badges = [reasonBadge(item)];
  if (item.manualReason === 'APPEAL' && item.rejectReason) {
    badges.push({ type: 'REJECTED', text: `자동 반려 · ${REVIEW_REJECT_REASON[item.rejectReason] ?? item.rejectReason}` });
  }
  return {
    imageReviewId: item.reviewId,
    badges,
    productName: item.title,
    sellerNickname: item.sellerNickname,
    price: Number(item.price),
    reviewVersion: item.reviewVersion,
    waitedMinutes: minutesBetween(item.reviewedAt, now),
    remainingMinutes: minutesBetween(now, item.expiresAt),
    photos: item.imageUrls ?? [],
    appeal: item.appealMemo ? { memo: item.appealMemo, createdAt: item.appealedAt } : null,
    engine: toEngine(item),
    selectedSpeciesName: item.speciesName,
    candidates: (item.engineResult?.plant?.candidates ?? []).map((candidate) => ({
      scientificName: candidate.scientificName,
      koreanName: candidate.koreanName,
      matchNote:
        item.speciesScientificName && candidate.scientificName === item.speciesScientificName ? '판매자 선택과 같음' : null,
      percent: Math.round(candidate.confidence * 100),
    })),
    description: item.description,
    history: toHistory(item),
    autoRejectReason: item.rejectReason ?? null,
  };
}

// 반려 모달 값 → PATCH 본문 (BE AdminReviewDecisionRequest)
export function toRejectBody({ reasonCode, reasonText }) {
  return { decision: 'REJECTED', rejectReason: reasonCode, memo: reasonCode === 'OTHER' ? reasonText : null };
}

export const APPROVE_BODY = { decision: 'APPROVED' };
