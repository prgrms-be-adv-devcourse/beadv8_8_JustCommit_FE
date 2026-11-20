import { formatPrice } from '../../utils/format';
import { EMPTY } from '../../constants/emptyText';

// 금액 표시: 숫자면 "128,500원", 숫자가 아니거나 없으면 「-」
export function won(value) {
  return typeof value === 'number' ? formatPrice(value) : EMPTY;
}

// 금액 입력: 숫자만 남기고 자릿수 제한
export function parseAmount(text, maxDigits = 8) {
  return Number(String(text).replace(/\D/g, '').slice(0, maxDigits));
}
