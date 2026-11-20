// 관리자 확인 대기 응답(BE AdminImageReviewResponse) → 사진 검수 목록 · 상세 화면 모양
// 응답 필드는 api/adminApi.js 참고
import { ADMIN_REJECT_REASONS } from '../../constants/imageReview';
import { formatStepTime } from '../../utils/format';
import { orEmpty } from '../../constants/emptyText';

// 관리자 확인으로 보낸 이유 (BE ManualReason) → 배지
const MANUAL_REASON_BADGE = {
  APPEAL: { type: 'APPEAL', text: '이의 신청' },
  BANNED_SUSPECTED: { type: 'BANNED_SUSPECT', text: '금지 품종 의심' },
  REVIEW_KEYWORD: { type: 'DEFAULT', text: '확인 단어 포함' },
  OTHER_SPECIES: { type: 'DEFAULT', text: '기타 품종' },
  LOW_CONFIDENCE: { type: 'DEFAULT', text: '품종 확신 낮음' },
  SPECIES_MISMATCH: { type: 'DEFAULT', text: '품종 불일치' },
  ENGINE_ERROR: { type: 'DEFAULT', text: '엔진 오류' },
  REPEATED_REJECTIONS: { type: 'DEFAULT', text: '반복 반려' },
};

// 판매 형태 (BE SaleForm)
const SALE_FORM_LABEL = { PLANT: '심어진 식물', SEED: '씨앗', CUTTING: '삽수', BULB: '구근' };

const MINUTE_MS = 60 * 1000;

function minutesBetween(from, to) {
  return Math.max(0, Math.floor((new Date(to) - new Date(from)) / MINUTE_MS));
}

function reasonBadge(review) {
  return MANUAL_REASON_BADGE[review.manualReason] ?? { type: 'DEFAULT', text: '관리자 확인' };
}

function speciesName(review) {
  return review.otherSpecies ? '기타' : review.speciesName;
}

// 기다린 시간: 관리자 확인으로 넘어온 뒤(이의 신청이면 이의 신청 뒤)부터
function timing(review, now) {
  return {
    waitedMinutes: minutesBetween(review.reviewedAt ?? review.requestedAt, now),
    remainingMinutes: review.expiresAt ? minutesBetween(now, review.expiresAt) : 0,
  };
}

// 목록 PagingResponse → { pendingCount, overdueCount, appealCount, reviews[] }
// 12시간 지남 · 이의 신청 수는 BE가 따로 주지 않아 받은 페이지에서 셈 (size 100이라 대기 100건 넘으면 일부만 셈)
export function toReviewList(paging, now = new Date()) {
  const content = paging?.content ?? [];
  return {
    pendingCount: paging?.totalElements ?? content.length,
    overdueCount: content.filter((review) => review.delayed).length,
    appealCount: content.filter((review) => review.manualReason === 'APPEAL').length,
    reviews: content.map((review) => ({
      imageReviewId: review.reviewId,
      ...timing(review, now),
      productName: review.title,
      photoCount: review.imageUrls?.length ?? 0,
      price: review.price,
      sellerNickname: review.sellerNickname,
      selectedSpeciesName: speciesName(review),
      reason: reasonBadge(review),
    })),
  };
}

function toEngine(review) {
  const moderation = review.engineResult?.moderation;
  const plant = review.engineResult?.plant;
  const failed = '결과 없음 (엔진 오류)';
  let harmful = failed;
  if (moderation) {
    if (moderation.imageFlagged) harmful = '사진 유해 의심';
    else if (moderation.textFlagged) harmful = '글 유해 의심';
    else harmful = '문제 없음';
  }
  let plantText = failed;
  if (plant) plantText = plant.plant ? '식물' : '식물 아님';
  return {
    harmful,
    plant: plantText,
    saleForm: plant?.saleForm ? (SALE_FORM_LABEL[plant.saleForm] ?? plant.saleForm) : failed,
    saleFormIsRejectReason: Boolean(plant?.saleForm) && plant.saleForm !== 'PLANT',
    bannedSuspect: review.manualReason === 'BANNED_SUSPECTED' ? (review.detail ?? '의심') : '없음',
  };
}

function toCandidates(review) {
  return (review.engineResult?.plant?.candidates ?? []).map((candidate) => ({
    scientificName: candidate.scientificName,
    koreanName: candidate.koreanName ?? '',
    percent: Math.round((candidate.confidence ?? 0) * 100),
    matchNote:
      !review.otherSpecies && candidate.scientificName === review.speciesScientificName ? '판매자 선택' : null,
  }));
}

function toHistory(review) {
  const history = [{ time: formatStepTime(review.requestedAt), text: `검수 요청 (버전 ${orEmpty(review.reviewVersion)})` }];
  if (review.appealedAt) {
    const reason = ADMIN_REJECT_REASONS.find((item) => item.code === review.rejectReason);
    history.push({ time: formatStepTime(review.appealedAt), text: `자동 반려${reason ? ` (${reason.label})` : ''} 뒤 이의 신청` });
  } else if (review.reviewedAt) {
    history.push({ time: formatStepTime(review.reviewedAt), text: `관리자 확인으로 넘어옴 · ${reasonBadge(review).text}` });
  }
  if (review.detail) history.push({ time: '', text: `걸린 내용: ${review.detail}` });
  return history;
}

// 목록 항목 하나 → 상세 화면 모양
export function toReviewDetail(review, now = new Date()) {
  const badges = [reasonBadge(review)];
  if (review.manualReason === 'APPEAL' && review.rejectReason) {
    const reason = ADMIN_REJECT_REASONS.find((item) => item.code === review.rejectReason);
    badges.push({ type: 'REJECTED', text: `자동 반려 · ${reason?.label ?? review.rejectReason}` });
  }
  if (review.scope === 'TEXT_ONLY') badges.push({ type: 'DEFAULT', text: '글 검사' });
  return {
    imageReviewId: review.reviewId,
    badges,
    productName: review.title,
    sellerNickname: review.sellerNickname,
    price: review.price,
    reviewVersion: review.reviewVersion,
    ...timing(review, now),
    photos: review.imageUrls ?? [],
    appeal: review.appealMemo ? { memo: review.appealMemo, createdAt: review.appealedAt } : null,
    engine: toEngine(review),
    selectedSpeciesName: review.otherSpecies
      ? '기타'
      : `${review.speciesName}${review.speciesScientificName ? ` (${review.speciesScientificName})` : ''}`,
    candidates: toCandidates(review),
    description: review.description,
    history: toHistory(review),
    autoRejectReason: review.rejectReason ?? null,
  };
}
