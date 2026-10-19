// 충전 후 돌아갈 경로: 우리 사이트 안의 경로만 허용 (외부 주소로 보내는 악용 방지)
export function safeReturnTo(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}
