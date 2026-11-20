// 값이 없을 때 화면에 보여 줄 기본값 (자리 문구 · undefined · NaN 대신)
// 사람 이름 · 표 칸 · 시각 · 숫자가 없으면 「-」
export const EMPTY = '-';
// 송장번호가 아직 없음 (판매자가 배송 예약 전)
export const NO_TRACKING_NO = '예약 전';
// 배송 현재 위치가 아직 없음
export const NO_LOCATION = '조회 전';
// 취소 주체(구매자 · 판매자 · 자동)를 모를 때 취소 배지
export const CANCELLED_LABEL = '취소됨';

// null · undefined · '' 이면 EMPTY, 아니면 값 그대로
export function orEmpty(value) {
  return value == null || value === '' ? EMPTY : value;
}

// 숫자면 천 단위 쉼표, 아니면 EMPTY
export function numberOrEmpty(value) {
  const number = Number(value);
  return value == null || value === '' || !Number.isFinite(number) ? EMPTY : number.toLocaleString('ko-KR');
}
