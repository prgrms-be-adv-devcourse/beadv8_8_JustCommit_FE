// 사진 검수 (BE docs/flows/image-review.md 「관리자 수동 검수」)

// 관리자 반려 사유 — 순서 · 이름은 시안 09-2-3 그대로, 판매자 문구는 docs 표 그대로
export const ADMIN_REJECT_REASONS = [
  {
    code: 'SPECIES_MISMATCH',
    label: '선택한 품종과 다름',
    message: '선택한 품종과 사진 속 식물이 달라요',
  },
  { code: 'UNCLEAR_IMAGE', label: '사진 불명확', message: '사진으로 상품을 확인하기 어려워요' },
  { code: 'NOT_PLANT', label: '식물 아님', message: '식물 사진이 아니에요' },
  {
    code: 'PROHIBITED_FORM',
    label: '씨앗 · 삽수 · 구근',
    message: '씨앗 · 삽수 · 구근은 팔 수 없어요',
  },
  { code: 'BANNED_SPECIES', label: '판매 금지 품종', message: '판매 금지 품종이에요' },
  { code: 'HARMFUL_IMAGE', label: '부적절한 사진', message: '부적절한 사진이 포함돼 있어요' },
  {
    code: 'INAPPROPRIATE_TEXT',
    label: '부적절한 글',
    message: '제목이나 설명에 부적절한 내용이 있어요',
  },
  { code: 'OTHER', label: '기타', message: '직접 입력한 내용' },
];

// 「기타」 사유 최대 글자 수 (docs: 필수, 200자)
export const OTHER_REASON_MAX_LENGTH = 200;

// 관리자 확인으로 넘어온 뒤 알림 · 강조 기준 (docs: 12시간)
export const REVIEW_OVERDUE_MINUTES = 12 * 60;

// 확인할 이유 배지 색 (시안 09-2-1 · 09-2-2)
// APPEAL: 이의 신청 · REJECTED: 자동 반려 · BANNED_SUSPECT: 금지 품종 의심 · 그 밖: 회색
export const REVIEW_BADGE_CLASS = {
  APPEAL: 'bg-[#eff6ff] border border-[#bfdbfe] text-[#1d4ed8]',
  REJECTED: 'bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c]',
  BANNED_SUSPECT: 'bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c]',
  DEFAULT: 'bg-[#f3f4f6] text-[#4b5563]',
};

// 관리자 확인으로 보낸 이유 (BE ManualReason) → 「확인할 이유」 배지
// TODO: 배지 문구는 시안에 사유별로 그려져 있지 않아 임시 문구. 시안 · 기획이 정하면 바꿈
export const MANUAL_REASON_BADGE = {
  APPEAL: { type: 'APPEAL', text: '이의 신청' },
  BANNED_SUSPECTED: { type: 'BANNED_SUSPECT', text: '금지 품종 의심' },
  REVIEW_KEYWORD: { type: 'DEFAULT', text: '확인 단어 포함' },
  OTHER_SPECIES: { type: 'DEFAULT', text: '기타 품종' },
  LOW_CONFIDENCE: { type: 'DEFAULT', text: '품종 판단 어려움' },
  SPECIES_MISMATCH: { type: 'DEFAULT', text: '선택 품종과 다름' },
  ENGINE_ERROR: { type: 'DEFAULT', text: '자동 검수 오류' },
  REPEATED_REJECTIONS: { type: 'DEFAULT', text: '반려 반복' },
};

// 엔진이 본 판매 형태 (BE SaleForm). PLANT 말고는 자동 반려 근거
export const SALE_FORM_LABEL = {
  PLANT: '심어진 식물',
  SEED: '씨앗',
  CUTTING: '삽수',
  BULB: '구근',
};
