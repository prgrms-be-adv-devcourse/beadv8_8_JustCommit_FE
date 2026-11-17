// 판매자 1명당 배송비 (백엔드 OrderService와 같은 값, 세미 기본 배송비)
// TODO: 배송비 정책이 확정되면 백엔드 응답 값으로 교체
export const SHIPPING_FEE_PER_SELLER = 3000;

// 배송 완료 후 자동 구매 확정까지 걸리는 날 (백엔드 자동 구매 확정 스케줄러)
export const AUTO_CONFIRM_DAYS = 3;

// 백엔드 SettlementPolicy.FEE_RATE (판매 금액의 5%, 원 단위 버림)
export const SETTLEMENT_FEE_RATE = 0.05;
