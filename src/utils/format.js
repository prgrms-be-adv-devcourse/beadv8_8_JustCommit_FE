/**
 * 금액을 "100,000원" 형태로 변환
 * 값이 없으면(null, undefined) 0원으로 표시
 */
export function formatPrice(amount) {
  return `${(amount ?? 0).toLocaleString('ko-KR')}원`;
}

/**
 * 초를 "04:59" 형태로 변환
 */
export function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}
