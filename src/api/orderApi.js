import client from './client';
import { getSeller } from './memberApi';

// 장바구니 항목으로 주문 생성 + 예치금 결제 (서버가 주문 저장·상품 예약·결제를 한 번에 처리)
// form = { cartItemIds, recipientName, recipientPhone, zipcode, address1, address2 } (BE CartOrderCreateRequest)
// → 200 { orderId, orderNo, totalAmount, itemCount, createdAt, status, expiresAt } (BE OrderCreateResponse, ApiResponse 없음)
// status: PAID(결제 완료) | PAYMENT_PENDING(잔액 부족으로 결제 대기 10분, 상품은 잠시 예약됨)
//         | PAYMENT_PROCESSING(결제 결과 확인 중, 복구가 확정) | PAYMENT_FAILED(예약 결과 불명 · 결제 거절 · 결제 서버 연결 실패)
// 실패: 409 PRICE_CHANGED(장바구니에 저장된 가격과 지금 가격이 다름) · 409 PRODUCT_UNAVAILABLE · 400 OWN_PRODUCT
// TODO: 화면은 expectedShippingFee도 보내지만 BE가 받지 않음(무시됨). SHIPPING_FEE_CHANGED도 BE에 없어
//  주문서의 배송비 변경 분기는 지금 도달하지 않음. 배송지별 배송비 계산이 BE에 생기면 필드 이름 · 에러 응답을 맞춤
export function createCartOrder(form) {
  return client.post('/api/v1/orders/cart', form);
}

// 결제 대기 주문 결제 (충전한 뒤 이어서 결제) → 200 주문 생성과 같은 응답
// 잔액 부족이어도 200 + status PAYMENT_PENDING(결제 대기 유지). PAYMENT_PROCESSING · PAYMENT_FAILED도 200 (BE OrderService.repayment)
// 실패: PAYMENT_WINDOW_EXPIRED(주문 시각부터 10분이 지남)
export function payOrder(orderId) {
  return client.post(`/api/v1/orders/${orderId}/pay`);
}

// TODO: 배송지별 배송비 계산 API가 아직 없음 (백엔드 docs에도 없음, 서버는 결제 때만 배송지로 계산).
//  생기면 { zipcode, sellerIds } → { sellers: [{ sellerId, fee, baseFee, extraFee }], regionLabel }처럼 받아
//  제주 · 도서산간 추가 요금을 주문서에 미리 보여 줍니다. 지금은 null(= 판매자별 기본 요금)을 돌려줍니다.
export function quoteShippingFee() {
  return Promise.resolve(null);
}

// 구매자 주문 목록 (최신순) params = { page, size }
// → { content: [{ orderId, orderNo, totalAmount, itemCount, status, representativeItemName, thumbnailUrl, createdAt }], page, size, totalElements, totalPages }
// 주문 API는 ApiResponse로 감싸지 않고 DTO를 그대로 반환
export function getOrders(params) {
  return client.get('/api/v1/orders', { params });
}

// 주문 상세 → { orderId, orderNo, totalAmount, itemCount, status, createdAt, recipient…, sellerOrders[] }
// sellerOrders[] = { id, sellerId, items[], totalAmount, shippingFee, shipmentId, shipmentStatus,
//                    bookedAt?, pickedUpAt?, inTransitAt?, deliveredAt, confirmedAt } (? = 백엔드 추가 예정)
// items[] = { id, productId, productName, price, status, purchaseConfirmable, thumbnailUrl }
export function getOrder(orderId) {
  return client.get(`/api/v1/orders/${orderId}`);
}

// 판매 주문 목록 (최근 주문 순) params = { page, size }
// → { content: [{ sellerOrderId, orderId, orderNo, totalAmount, itemCount, status, representativeItemName, thumbnailUrl, createdAt }], totalPages, … }
// totalAmount는 상품 금액 + 배송비
export function getSellerOrders(params) {
  return client.get('/api/v1/orders/seller', { params });
}

// 판매 주문 상세 → { sellerOrderId, orderNo, totalAmount, shippingFee, status, createdAt, recipient…, items[] }
export function getSellerOrder(sellerOrderId) {
  return client.get(`/api/v1/orders/seller/${sellerOrderId}`);
}

// 주문 상품 하나 취소 (택배 수거 전까지만 가능, 예치금 환불) → 200 본문 없음
// 바로 환불되거나, 택배 취소 결과를 기다려야 하면 주문상품이 CANCEL_PROCESSING이 됨 (BE ADR 0026)
// 이미 취소 중(CANCEL_PROCESSING) · 취소됨(CANCELLED)인 상품을 다시 취소하면 에러 없이 200 (BE OrderCancelTransactions.requestItemCancel)
// 실패 409: SHIPMENT_NOT_CANCELABLE(기사님 2km 안) · ORDER_ITEM_NOT_CANCELABLE · ORDER_NOT_PAID
export function cancelOrderItem(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/cancel`);
}

// 구매자 주문 전체 취소 (시안 03-5-3, 모든 판매자 주문의 남은 상품) → 200 본문 없음. 실패 코드는 상품 하나 취소와 같음
export function cancelOrder(orderId) {
  return client.post(`/api/v1/orders/${orderId}/cancel`);
}

// 주문 상품 구매 확정 (배송 완료 후, 판매자 정산이 시작됨) → 200 본문 없음
// 실패 409: SHIPMENT_NOT_DELIVERED · ORDER_ITEM_NOT_CONFIRMABLE
export function confirmOrderItem(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/confirm`);
}

// TODO: 백엔드 API가 아직 없음 (docs/reference/external-apis.md 「추가 예정」 · market)
// 경로 · 요청 형식은 담당이 확정하면 맞춥니다. 버튼을 누르면 부르고, API가 없으면 실패 안내가 보입니다.

// 판매자 수락 · 거절: 체크한 주문상품만 거절(사유 없음), 나머지는 수락 → 200 본문 없음
// BE: 거절할 상품이 없으면 POST …/accept(본문 없음, 남은 수락 대기 상품을 모두 수락),
//     있으면 POST …/reject { orderItemIds } (고른 상품은 환불, 나머지는 수락) (BE OrderController · SellerOrderRejectRequest)
// 실패: 409 SELLER_ORDER_NOT_ACCEPTABLE(수락 대기 상품이 없거나 이미 처리됨) · 400 INVALID_REJECT_ITEMS
// senderAddressId: 보내는 주소로 고른 판매자 배송지 id (시안 08-5-2)
// TODO(market): BE 수락 · 거절 API가 보내는 주소(senderAddressId)를 받지 않음. 생기면 요청에 넣음
// eslint-disable-next-line no-unused-vars
export function respondSellerOrder(sellerOrderId, rejectedOrderItemIds, senderAddressId) {
  if (rejectedOrderItemIds?.length > 0) {
    return client.post(`/api/v1/orders/seller/${sellerOrderId}/reject`, { orderItemIds: rejectedOrderItemIds });
  }
  return client.post(`/api/v1/orders/seller/${sellerOrderId}/accept`);
}

// 반품 승인 · 거절 (판매자, BE #383 · #593). 본문 없음, 200. 이미 처리됐으면 409 RETURN_NOT_DECIDABLE
// 승인: 반품 배송을 만듦 / 거절: 그 주문상품을 바로 구매 확정
export function approveReturn(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/return/approve`);
}

export function rejectReturn(orderItemId) {
  return client.post(`/api/v1/orders/items/${orderItemId}/return/reject`);
}

// 반품 신청 (BE OrderController.requestReturn · ReturnRequestCreateRequest). 성공은 200 본문 없음
// reason = BE ReturnReason: 'DAMAGED' | 'NOT_AS_DESCRIBED' | 'OTHER' (OTHER면 reasonDetail 필수, 최대 500자)
// 실패 code: RETURN_ALREADY_REQUESTED · RETURN_NOT_REQUESTABLE · RETURN_PERIOD_EXPIRED (409)
export function requestReturn(orderItemId, { reason, detail }) {
  return client.post(`/api/v1/orders/items/${orderItemId}/return`, { reason, reasonDetail: detail });
}

// 배송 조회 (BE #588 · PR #605): 단계별 시각 + 택배사 값(courierStatus · driverDistanceKm · locationName · driverCheckedAt)
// 응답은 ApiResponse로 감싸지 않은 ShipmentTrackingResponse. 택배사 실패 · 시간 초과면 택배사 4칸만 null(200),
// 배송 전(수락 전)이면 404 SHIPMENT_TRACKING_NOT_FOUND
export function getSellerShipmentTracking(sellerOrderId) {
  return client.get(`/api/v1/orders/seller/${sellerOrderId}/shipment`);
}

export function getBuyerShipmentTracking(orderId, sellerOrderId) {
  return client.get(`/api/v1/orders/${orderId}/sellerOrders/${sellerOrderId}/shipment`);
}

// 수거 전 택배사 단계: 이때만 남은 거리가 「기사님 → 수거지」 거리 (수거 뒤에는 간선 · 배송 구간 거리라 박스를 숨김)
const BEFORE_PICKUP_COURIER_STATUSES = ['RESERVED', 'NEAR_5KM', 'CANCEL_LOCKED'];
// 택배 예약 뒤 · 배송이 끝나거나 취소되기 전에만 조회 (그 밖은 택배사 값이 늘 null)
const TRACKABLE_SHIPMENT_STATUSES = ['BOOKED', 'CANCEL_LOCKED', 'PICKED_UP', 'IN_TRANSIT'];

export function isTrackableShipment(shipmentStatus) {
  return TRACKABLE_SHIPMENT_STATUSES.includes(shipmentStatus);
}

/**
 * 배송 조회 응답을 판매자 주문(구매자 상세의 sellerOrders[] 또는 판매자 상세 응답)에 합침
 * - 거리: 수거 전 단계일 때만 driverDistanceKm · driverCheckedAt (아니면 null → 거리 박스 숨김)
 * - 현재 위치: locationName → currentLocation (화면이 읽는 이름)
 * - 단계 시각은 원래 응답에 없을 때만 채움
 * 실패(404 · #605 배포 전 등)하면 원래 값을 그대로 돌려줌
 */
export async function withShipmentTracking(target, fetchTracking) {
  if (!target || !isTrackableShipment(target.shipmentStatus)) return target;
  try {
    const response = await fetchTracking();
    const t = response.data?.data ?? response.data;
    if (!t) return target;
    const beforePickup = BEFORE_PICKUP_COURIER_STATUSES.includes(t.courierStatus);
    return {
      ...target,
      trackingNo: target.trackingNo ?? t.trackingNo,
      bookedAt: target.bookedAt ?? t.bookedAt,
      pickedUpAt: target.pickedUpAt ?? t.pickedUpAt,
      inTransitAt: target.inTransitAt ?? t.inTransitAt,
      deliveredAt: target.deliveredAt ?? t.deliveredAt,
      courierStatus: t.courierStatus ?? null,
      driverDistanceKm: beforePickup && t.driverDistanceKm != null ? Number(t.driverDistanceKm.toFixed(1)) : null,
      driverCheckedAt: beforePickup ? (t.driverCheckedAt ?? null) : null,
      currentLocation: t.locationName ?? null,
    };
  } catch {
    return target;
  }
}

// 목록 항목마다 추가 조회를 부를 때 동시에 limit개까지만 부름 (결과 순서 = 입력 순서)
export async function mapWithLimit(list, limit, fn) {
  const results = new Array(list.length);
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const index = next;
      next += 1;
      results[index] = await fn(list[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return results;
}

// 판매자 닉네임: 주문 응답에는 sellerId만 있어서 member 공개 API(GET sellers/{sellerId} → data.nickname)로 채움
// 같은 판매자는 한 번만 부름. 실패하면 null(화면은 「-」)이고 다음에 다시 부름
const sellerNicknameCache = new Map();
export function getSellerNickname(sellerId) {
  if (sellerId == null) return Promise.resolve(null);
  if (!sellerNicknameCache.has(sellerId)) {
    const request = getSeller(sellerId)
      .then((response) => response.data?.data?.nickname ?? null)
      .catch(() => {
        sellerNicknameCache.delete(sellerId);
        return null;
      });
    sellerNicknameCache.set(sellerId, request);
  }
  return sellerNicknameCache.get(sellerId);
}

// 주문 상세 응답의 sellerOrders[]에 판매자 닉네임(sellerNickname · sellerName)을 붙임. 실패해도 주문은 그대로 돌려줌
export async function withSellerNicknames(order) {
  const sellerOrders = order?.sellerOrders ?? [];
  if (sellerOrders.length === 0) return order;
  const nicknames = await Promise.all(sellerOrders.map((sellerOrder) => getSellerNickname(sellerOrder.sellerId)));
  return {
    ...order,
    sellerOrders: sellerOrders.map((sellerOrder, index) =>
      nicknames[index] == null
        ? sellerOrder
        : { ...sellerOrder, sellerNickname: nicknames[index], sellerName: nicknames[index] },
    ),
  };
}
