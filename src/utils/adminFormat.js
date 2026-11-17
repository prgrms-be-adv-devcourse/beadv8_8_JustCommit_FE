// 관리자 화면 숫자 · 시간 표시 (시안 09 형식)

// 분 → "14시간 20분" · "25분" · "3시간"
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}분`;
  if (rest === 0) return `${hours}시간`;
  return `${hours}시간 ${rest}분`;
}

// 숫자 → "19,650" (원 없이, 표 안 숫자)
export function formatNumber(value) {
  return value.toLocaleString('ko-KR');
}

// 돌려준 금액 → "−3,000" (빼기 기호 U+2212). 0이면 "0"
export function formatMinus(value) {
  return value === 0 ? '0' : `−${formatNumber(value)}`;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// "2026-10-15" → { full: "2026.10.15 (목)", day: "2026.10.15", short: "10.15" }
export function formatReportDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return {
    full: `${year}.${mm}.${dd} (${weekday})`,
    day: `${year}.${mm}.${dd}`,
    short: `${mm}.${dd}`,
  };
}
