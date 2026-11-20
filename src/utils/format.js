import { EMPTY } from '../constants/emptyText';

/**
 * 값 → Date. 없거나(null, undefined, '') 날짜로 못 읽으면 null
 * (new Date(null)은 1970년이 되므로 먼저 걸러 냄)
 */
export function toValidDate(value) {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * 금액을 "100,000원" 형태로 변환
 * 값이 없으면(null, undefined) 0원으로 표시, 숫자가 아니면(NaN) "-"
 */
export function formatPrice(amount) {
  const number = Number(amount ?? 0);
  if (!Number.isFinite(number)) return EMPTY;
  return `${number.toLocaleString('ko-KR')}원`;
}

/**
 * 날짜를 "2026.10.15" 형태로 변환 (값이 없으면 "-")
 */
export function formatDate(value) {
  const date = toValidDate(value);
  if (!date) return EMPTY;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}.${month}.${day}`;
}

/**
 * 날짜·시각을 "2026.10.15 14:32" 형태로 변환 (값이 없으면 "-")
 */
export function formatDateTime(value) {
  const date = toValidDate(value);
  if (!date) return EMPTY;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(value)} ${hours}:${minutes}`;
}

/**
 * 배송 단계 아래 시각을 "10/19 10:07" 형태로 변환 (값이 없으면 "-")
 */
export function formatStepTime(value) {
  const date = toValidDate(value);
  if (!date) return EMPTY;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
}

/**
 * 초를 "04:59" 형태로 변환
 */
export function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) return EMPTY;
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

/**
 * 등록 시각을 "방금 전", "12분 전", "3시간 전", "어제", "3일 전", "2주 전", "3달 전", "1년 전" 형태로 변환
 * 7~29일 = N주 전 (7일 단위 내림), 30~364일 = N달 전 (30일 단위 내림, 최대 11달), 365일 이상 = N년 전 (365일 단위 내림)
 */
export function formatRelativeTime(value) {
  const date = toValidDate(value);
  if (!date) return EMPTY;
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSeconds < 60) return '방금 전';

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.min(Math.floor(days / 30), 11)}달 전`;

  return `${Math.floor(days / 365)}년 전`;
}

/**
 * 휴대폰 번호를 "010-1234-5678" 형태로 변환 (11자리가 아니면 그대로)
 */
export function formatPhone(phone) {
  if (!phone || phone.length !== 11) return phone ?? '';
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}

/**
 * 휴대폰 번호 가운데를 가려 "010-****-5678" 형태로 변환 (11자리가 아니면 그대로)
 */
export function maskPhone(phone) {
  if (!phone || phone.length !== 11) return phone ?? '';
  return `${phone.slice(0, 3)}-****-${phone.slice(7)}`;
}
