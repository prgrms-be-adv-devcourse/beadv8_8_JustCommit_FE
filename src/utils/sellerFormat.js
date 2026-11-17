// 판매자 화면(시안 08 · 04 판매 주문 상세)에서 쓰는 날짜 표기

const pad = (value) => String(value).padStart(2, '0');

/** "10월 17일 14:20" (수락 · 반품 응답 마감) */
export function formatMonthDayTime(value) {
  const date = new Date(value);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "10.13 09:40" (배송 단계 · 현재 위치 시각) */
export function formatShortDateTime(value) {
  const date = new Date(value);
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 시각에 시간을 더함 (수락 마감 = 결제 완료 + 24시간 등) */
export function addHours(value, hours) {
  return new Date(new Date(value).getTime() + hours * 60 * 60 * 1000);
}
