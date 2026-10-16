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

/**
 * 등록 시각을 "방금 전", "12분 전", "3시간 전", "어제", "3일 전", 날짜 형태로 변환
 */
export function formatRelativeTime(value) {
  const date = new Date(value);
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSeconds < 60) return '방금 전';

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;

  return date.toLocaleDateString('ko-KR');
}

/**
 * 휴대폰 번호를 "010-1234-5678" 형태로 변환 (11자리가 아니면 그대로)
 */
export function formatPhone(phone) {
  if (!phone || phone.length !== 11) return phone ?? '';
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}

/**
 * 날짜를 "2026.10.12" 형태로 변환 (withTime이면 "2026.10.12 09:41")
 */
export function formatDate(value, withTime = false) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  const day = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
  return withTime ? `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
}
