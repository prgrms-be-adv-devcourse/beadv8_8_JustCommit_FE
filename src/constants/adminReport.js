// 수수료 · 배송비 리포트 기간 버튼 (시안 09-3 순서 그대로)
export const REPORT_PERIODS = [
  { key: 'TODAY', label: '오늘' },
  { key: 'WEEK', label: '이번 주' },
  { key: 'MONTH', label: '이번 달' },
  { key: 'CUSTOM', label: '직접 선택' },
];

// 수수료율 (BE docs/services/settlement.md 「정책」: 5%, 판매액에만)
export const FEE_RATE_PERCENT = 5;
