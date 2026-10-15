/**
 * 금액을 "100,000원" 형태로 변환
 * 값이 없으면(null, undefined) 0원으로 표시
 */
export function formatPrice(amount) {
  return `${(amount ?? 0).toLocaleString('ko-KR')}원`;
}
