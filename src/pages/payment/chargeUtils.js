import { formatPrice } from '../../utils/format';

// 금액 표시: 숫자면 "128,500원", 아직 백엔드에 없는 값(자리 문구 문자열)은 그대로
export function won(value) {
  return typeof value === 'number' ? formatPrice(value) : value;
}

// 금액 입력: 숫자만 남기고 자릿수 제한
export function parseAmount(text, maxDigits = 8) {
  return Number(String(text).replace(/\D/g, '').slice(0, maxDigits));
}
