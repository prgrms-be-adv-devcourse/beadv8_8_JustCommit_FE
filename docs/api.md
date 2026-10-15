# API 연동

기준: 백엔드 레포 `prgrms-be-adv-devcourse/beadv8_8_JustCommit_BE`의 `develop` 브랜치 (2026-10-15 확인).
요청·응답 필드는 백엔드의 컨트롤러와 DTO가 기준이다. 이 문서와 백엔드가 다르면 백엔드를 따르고, 이 문서를 고친다.

## 호출 방법

- 모든 요청은 `src/api/client.js`의 `client`로 보낸다. 경로는 `/api/v1/...` 전체를 쓴다.
- 도메인별 함수는 `src/api/<도메인>.js`에 둔다 (`member.js`, `product.js`, `market.js`, `payment.js`, `settlement.js`, `notification.js`).
- 함수는 응답 본문의 실제 데이터만 돌려준다. 페이지는 응답 형태 차이를 몰라도 되게 한다(아래 "응답 형태 두 가지").

## 응답 형태 두 가지

백엔드 모듈마다 응답 형태가 다르다. API 함수 안에서 맞춰서 꺼낸다.

| 형태 | 쓰는 곳 | 데이터 위치 |
|---|---|---|
| `ApiResponse` 감싸기: `{ status, code?, message, data? }` | member, product, payment(wallet·charge) | `response.data.data` |
| 감싸지 않음: DTO 그대로 | market(장바구니·주문) | `response.data` |

에러는 `ApiResponse` 형태로 온다: `{ status, code, message }`. 화면에는 `message`를 보여 주고, 분기는 `code`로 한다(문자열 비교, 예: `INSUFFICIENT_BALANCE`).

페이지 응답은 `PagingResponse` 또는 Spring `Page`다. 목록 함수에서 `{ items, hasNext, totalCount }` 같은 한 가지 모양으로 바꿔서 돌려준다.

## 인증

- 로그인 응답의 Access 토큰을 `setAccessToken`으로 메모리에 둔다.
- 리프레시 토큰은 HttpOnly 쿠키(경로 `/api/v1/auth`)라 프론트에서 읽거나 저장하지 않는다. `withCredentials: true`가 이미 설정돼 있다.
- 401이 오면 `client`가 `/api/v1/auth/reissue`로 재발급하고 원래 요청을 다시 보낸다. 재발급도 실패하면 `client`는 토큰을 지우고 에러를 던질 뿐이다. 로그인 페이지로 보내는 처리는 로그인이 필요한 라우트 가드에서 한다.
- 리프레시 쿠키는 `SameSite=Lax`다. 운영에서 프론트와 백엔드 도메인이 다른 사이트가 되면 재발급 요청에 쿠키가 안 붙는다. 배포 주소를 정할 때 인프라 담당과 확인한다.
- 새로고침하면 메모리 토큰이 사라진다. 앱 시작 시 `reissueAccessToken()`을 한 번 호출해 로그인 상태를 복구한다(실패하면 비로그인 상태).
- 판매자 등록 후에는 Role이 바뀌므로 재발급을 한 번 호출한다.

## 엔드포인트

`구현` 백엔드 develop에 있음 / `미구현` 명세만 있음 → 목 데이터 + `// TODO(api)` 주석

### 회원 (`ApiResponse`)

| 기능 | 메서드 | 경로 | 상태 |
|---|---|---|---|
| 인증번호 발송 | POST | `/api/v1/auth/email/send` | 구현 |
| 인증번호 확인 | POST | `/api/v1/auth/email/verify` | 구현 |
| 로그인 | POST | `/api/v1/auth/login` | 구현 |
| 토큰 재발급 | POST | `/api/v1/auth/reissue` | 구현 |
| 로그아웃 | POST | `/api/v1/auth/logout` | 구현 |
| 회원가입 | POST | `/api/v1/users` | 구현 |
| 소셜 회원가입 완료 | POST | `/api/v1/users/social` | 구현 |
| 닉네임 중복 확인 | GET | `/api/v1/users/checkNickname?nickname=` | 구현 |
| 내 정보 | GET | `/api/v1/users/me` | 구현 |
| 배송지 목록 / 등록 | GET / POST | `/api/v1/users/me/addresses` | 구현 |
| 기본 배송지 설정 | PATCH | `/api/v1/users/me/addresses/{addressId}/default` | 구현 |
| 판매자 등록 | POST | `/api/v1/sellers` | 구현 |
| 소셜 로그인 시작 | 페이지 이동 | `/oauth2/authorization/{kakao\|naver}` | 구현 (axios 아님) |

### 상품 (`ApiResponse`)

| 기능 | 메서드 | 경로 | 상태 |
|---|---|---|---|
| 상품 검색 | GET | `/api/v1/products` | 구현 |
| 상품 상세 | GET | `/api/v1/products/{productId}` | 구현 |
| 상품 등록 | POST | `/api/v1/products` | 구현 |
| 상품 수정 | PUT | `/api/v1/products/{productId}` | 구현 |
| 상품 삭제 | DELETE | `/api/v1/products/{productId}` | 구현 |
| 숨김 변경 | PATCH | `/api/v1/products/{productId}/hidden` | 구현 |
| 내 판매 목록 | GET | `/api/v1/products/me` | 구현 |
| 품종 목록 / 상세 | GET | `/api/v1/species`, `/api/v1/species/{speciesId}` | 구현 |
| 이미지 업로드 | POST | `/api/v1/images` | 미구현 |

### 장바구니·주문 (감싸지 않음)

| 기능 | 메서드 | 경로 | 상태 |
|---|---|---|---|
| 장바구니 조회 | GET | `/api/v1/cart` | 구현 |
| 장바구니 담기 | POST | `/api/v1/cart/items` | 구현 |
| 장바구니 삭제 | DELETE | `/api/v1/cart/items/{productId}` | 구현 |
| 주문 생성 + 결제 ("결제하기") | POST | `/api/v1/orders/cart` | 구현 |
| 결제 대기 주문 결제 (충전 후 재결제) | POST | `/api/v1/orders/{orderId}/pay` | 구현 |
| 구매자 주문 목록 / 상세 | GET | `/api/v1/orders`, `/api/v1/orders/{orderId}` | 구현 |
| 구매 확정 | POST | `/api/v1/orders/items/{orderItemId}/confirm` | 구현 |
| 판매자 주문 목록 / 상세 | GET | `/api/v1/orders/seller`, `/api/v1/orders/seller/{sellerOrderId}` | 구현 |
| 바로구매 | POST | `/api/v1/orders/direct` | 미구현 |
| 상품 단위 취소 / 전체 취소 | POST | `/api/v1/orders/items/{orderItemId}/cancel`, `/api/v1/orders/{orderId}/cancel` | 미구현 |

**주문 생성 + 결제 (`POST /api/v1/orders/cart`)**
- 요청: 선택한 `cartItemIds`와 배송지(받는 사람, 연락처, 우편번호, 주소1, 주소2).
- 서버는 한 트랜잭션에서 주문 저장 → 상품 예약(락, 상품 상태 `PAYMENT_PENDING`) → 예치금 결제를 한다.
- 잔액 충분: 주문 `PAID`, 상품 판매완료, 장바구니에서 해당 항목 삭제.
- 잔액 부족: 주문 `PAYMENT_PENDING`, 응답에 `expiresAt`(10분 뒤). 그동안 상품은 잡혀 있다. 프론트는 잔액을 미리 확인해 이 경우가 생기지 않게 한다.
- 실패(409 `PRODUCT_UNAVAILABLE` / `PRICE_CHANGED`)하면 전부 되돌아가고 장바구니는 그대로다. 응답에 상품 정보가 없으므로 장바구니를 다시 조회해 원인 상품을 찾는다. 다른 409: `OWN_PRODUCT`(본인 상품), `CHECKOUT_DATA_MISMATCH`(장바구니가 바뀜 → 장바구니로 돌려보낸다).

### 예치금 (`ApiResponse`)

| 기능 | 메서드 | 경로 | 상태 |
|---|---|---|---|
| 잔액 | GET | `/api/v1/wallet` | 구현 |
| 거래 내역 | GET | `/api/v1/wallet/transactions` | 구현 |
| 충전 요청 | POST | `/api/v1/wallet/charges` | 구현 |
| 충전 승인 | POST | `/api/v1/wallet/charges/{chargeId}/confirm` | 구현 |
| 충전 내역 / 상세 | GET | `/api/v1/wallet/charges`, `/api/v1/wallet/charges/{chargeId}` | 미구현 |
| 충전 취소 | POST | `/api/v1/wallet/charges/{chargeId}/cancel` | 미구현 |

### 정산 · 알림

| 기능 | 메서드 | 경로 | 상태 |
|---|---|---|---|
| 정산 요약 | GET | `/api/v1/settlements/summary` | 미구현 |
| 정산 내역 / 상세 | GET | `/api/v1/settlements`, `/api/v1/settlements/{settlementId}` | 미구현 |
| 알림 목록 | GET | `/api/v1/notifications` | 미구현 |
| 안 읽은 알림 수 | GET | `/api/v1/notifications/unread-count` | 미구현 |
| 알림 읽음 / 모두 읽음 | PATCH | 경로 미확정 (RESTful 수정 논의 중) | 미구현 |

## 이 문서 갱신

백엔드에 API가 추가되면 상태를 `구현`으로 바꾸고, 목 데이터와 `// TODO(api)` 주석을 실제 호출로 교체한다.
