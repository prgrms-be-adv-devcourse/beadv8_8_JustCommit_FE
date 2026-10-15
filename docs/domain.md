# 도메인 규칙

화면 문구, 상태 배지, 버튼 활성 조건의 기준이다. 상태 코드는 백엔드 enum 이름 그대로 오고, 화면에는 아래 표시 이름을 쓴다.
상태 코드 → 표시 이름 변환은 `src/utils/labels.js` 한 곳에 모은다.

## 서비스 정책 (화면에 쓸 수 있는 문구는 이것뿐)

- 모든 거래는 택배로만 한다. 위치·동네·직거래 기능은 없다.
- 결제는 예치금으로만 한다. 예치금은 토스페이먼츠로 충전한다.
- 에스크로: 구매자가 결제하면 플랫폼이 돈을 보관하고, 구매 확정 후 판매자에게 정산된다.
- 배송 완료 3일 뒤 자동으로 구매 확정된다.
- 식물 1개체 = 판매글 1개. 수량 개념이 없다.
- 판매자가 송장을 입력하지 않는다. 결제가 끝나면 택배가 자동 접수된다.
- 배송비가 있다. 금액은 API 값을 쓴다.

수수료율, 정산 주기, 고객센터 정보는 정해지지 않았다. 화면에 숫자나 약속을 만들어 넣지 않는다.

## 상품 상태 `ProductStatus`

| 코드 | 표시 | 화면 처리 |
|---|---|---|
| `ACTIVE` | 판매중 | 구매 가능 |
| `PAYMENT_PENDING` | 결제 대기 | 다른 사람이 주문서 작성 중. 구매 버튼 비활성 |
| `SOLD_OUT` | 판매완료 | 카드 흐리게, 구매 불가 |
| `DELETED` | — | 목록에 나오지 않음 |

숨김은 상태가 아니라 별도 값(`hidden`)이다. 내 판매 목록에서만 "숨김" 배지로 보인다.

## 주문 상태 `OrderStatus`

| 코드 | 표시 |
|---|---|
| `PAYMENT_PENDING` | 결제 대기 |
| `PAID` | 결제 완료 |
| `PAYMENT_FAILED` | 결제 실패 |
| `EXPIRED` | 결제 시간 만료 |
| `CANCELLED` | 주문 취소 |
| `COMPLETED` | 거래 완료 |

## 주문 상품 상태 `OrderItemStatus`

한 주문에 상품이 여러 개라 상품마다 상태가 따로 있다(부분 취소 때문).

| 코드 | 표시 |
|---|---|
| `NORMAL` | 진행 중 (배송 단계는 배송 상태로 표시) |
| `CANCELLED` | 취소됨 |
| `REFUND_REQUESTED` | 환불 요청 |
| `REFUNDED` | 환불 완료 |
| `CONFIRMED` | 구매 확정 |

## 배송 상태 `ShipmentStatus`

배송 단계 표시: 택배 예약 → 접수 완료 → 배송 중 → 배송 완료

| 코드 | 표시 |
|---|---|
| `READY` | 접수 준비 |
| `BOOKED` | 택배 예약 |
| `PICKED_UP` | 접수 완료 |
| `IN_TRANSIT` | 배송 중 |
| `DELIVERED` | 배송 완료 |
| `CANCELLED` | 접수 취소 |

## 버튼 활성 조건 (주문 상세)

| 버튼 | 조건 |
|---|---|
| 구매 확정 | 주문 상품 `NORMAL` + 배송 `DELIVERED` |
| 상품 취소 | 주문 `PAID` + 주문 상품 `NORMAL` + 배송 `READY` 또는 `BOOKED` (수거 전). 취소 API 미구현 |
| 배송 조회 | 송장번호가 있을 때 |

백엔드가 거절하면(4xx) 응답 `message`를 그대로 보여 준다. 조건이 백엔드와 다르면 백엔드를 따르고 이 표를 고친다.

## 예치금 거래 종류 `RefType`

| 코드 | 표시 | 방향 |
|---|---|---|
| `CHARGE` | 충전 | + |
| `CHARGE_CANCEL` | 충전 취소 | − |
| `PAYMENT` | 결제 | − |
| `SHIPPING_FEE` | 배송비 | − |
| `ORDER_REFUND`, `ORDER_ITEM_CANCEL_REFUND` | 환불 | + |
| `SHIPPING_FEE_REFUND` | 배송비 환불 | + |
| `SETTLEMENT` | 정산 | + |
| `SETTLEMENT_FEE` | 정산 수수료 | − |
| `CASH_OUT` | 출금 | − |
| `CASH_OUT_CANCEL` | 출금 취소 | + |

방향은 응답의 `IN`/`OUT` 값을 우선한다.

## 충전 상태 `ChargeStatus`

`READY` 결제 대기 / `APPROVED` 충전 완료 / `CANCELED` 취소 / `FAILED` 실패

## 회원 Role

`MEMBER` 일반 회원 / `SELLER` 판매자. 판매자 전용 페이지는 `SELLER`만 들어갈 수 있다.
