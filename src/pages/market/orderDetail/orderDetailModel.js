import { AUTO_CONFIRM_DAYS } from '../../../constants/order';
import { formatDateTime, formatPrice, maskPhone } from '../../../utils/format';

// 주문 상세 응답(getOrder) → 화면(OrderDetailView) 데이터
// 근거: BE docs/flows/cancel-refund.md · docs/services/market.md 「정책」
//
// 응답에 아직 없는 값은 {넣을값} 자리 문구로 둡니다. 백엔드에 추가되면 아래 TODO 필드명을 확인해 바꿔요.
// - sellerOrders[].sellerNickname          판매자 닉네임 (주문 응답에 없어 화면이 판매자 공개 API로 붙임: orderApi withSellerNicknames)
// - 판매자 수락 전: BE는 판매자 주문이 아니라 items[].status = ACCEPT_PENDING으로 줌 (없으면 배송이 없을 때 수락 전으로 봄)
// - sellerOrders[].trackingNo              송장번호
// - sellerOrders[].currentLocation         택배 현재 위치 한 줄 (예: 서울 성수 ○○대리점 · 배송 완료 · 10.13 11:02)
// - sellerOrders[].driverDistanceKm · driverCheckedAt   기사님 거리 · 조회 시각 (2km 안 취소 잠금은 shipmentStatus = CANCEL_LOCKED)
// - order.paidAt                           판매자 수락 마감(결제 완료 + 24시간) 계산용
// - items[].returnRequest                  { status: REQUESTED|APPROVED|SHIPPING|COMPLETED|REJECTED,
//                                            requestedAt, approvedAt, shippedAt, completedAt, rejectedAt, trackingNo, currentLocation }

export const SHIPPING_STEP_LABELS = ['판매자 확인 중', '픽업 대기', '수거', '배송 중', '배송 완료', '구매 확정'];
export const RETURN_STEP_LABELS = ['반품 신청', '판매자 승인', '반품 배송 중', '반품 완료'];

// 배송 상태 → 배송 단계 바의 지금 단계 (CANCEL_PENDING: 택배사 취소 결과를 기다리는 픽업 대기)
const SHIPPING_STEP_INDEX = { READY: 1, BOOKED: 1, CANCEL_LOCKED: 1, CANCEL_PENDING: 1, PICKED_UP: 2, IN_TRANSIT: 3, DELIVERED: 4 };

const RETURN_STEP_INDEX = { REQUESTED: 0, APPROVED: 1, SHIPPING: 2, COMPLETED: 3 };

const RETURN_WINDOW_HOURS = 72; // 배송 완료 후 반품 신청 기한
const ACCEPT_WINDOW_HOURS = 24; // 결제 완료 후 판매자 수락 기한

const pad = (value) => String(value).padStart(2, '0');

// "10.13 11:02"
export function formatShortDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// "10월 16일"
export function formatMonthDay(value) {
  const date = new Date(value);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// "10월 16일 11:02"
export function formatMonthDayTime(value) {
  const date = new Date(value);
  return `${formatMonthDay(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addHours(value, hours) {
  return new Date(new Date(value).getTime() + hours * 60 * 60 * 1000);
}

// 반품 신청 마감 (배송 완료 + 72시간)
export function getReturnDeadline(sellerOrder) {
  return sellerOrder.deliveredAt ? addHours(sellerOrder.deliveredAt, RETURN_WINDOW_HOURS) : null;
}

export function getSellerName(sellerOrder, index) {
  // 주문 상세 응답에는 sellerId만 있어 화면이 판매자 공개 API로 sellerNickname을 붙여 넘김 (실패하면 자리 문구)
  return sellerOrder.sellerNickname ?? `{판매자 ${index + 1} 닉네임}`;
}

// 판매자 수락 전: 주문상품 상태 ACCEPT_PENDING (BE OrderItemStatus)
// 구매자가 취소했고 택배 취소 · 환불 결과를 기다리는 주문상품 (BE ADR 0026)
const CANCELLING_ITEM_STATUSES = ['CANCEL_PROCESSING', 'REVIEW_REQUIRED'];

function isAcceptPending(sellerOrder) {
  if (sellerOrder.items.some((item) => item.status === 'ACCEPT_PENDING')) return true;
  return !sellerOrder.shipmentStatus;
}

// 반품 상태: returnRequest가 없으면 주문상품 상태로 짐작 (REFUND_REQUESTED → 신청, REFUNDED → 완료)
function getReturnStatus(item) {
  if (item.returnRequest?.status) return item.returnRequest.status;
  if (item.status === 'REFUND_REQUESTED') return 'REQUESTED';
  if (item.status === 'REFUNDED') return 'COMPLETED';
  return null;
}

function itemsText(items, unit) {
  if (items.length === 0) return '';
  return items.length > 1 ? `${items[0].productName} 외 ${items.length - 1}${unit}` : items[0].productName;
}

function getLocation(source) {
  return `현재 위치: ${source?.currentLocation ?? '{현재 위치}'}`;
}

function buildShippingSteps(order, sellerOrder, current) {
  // 시각은 판매자 확인 중(주문) · 배송 완료 · 구매 확정 단계에만 표시
  const times = [formatShortDateTime(order.createdAt), null, null, null, formatShortDateTime(sellerOrder.deliveredAt),
    formatShortDateTime(sellerOrder.confirmedAt)];
  return {
    label: '배송 단계',
    current,
    items: SHIPPING_STEP_LABELS.map((label, index) => ({ label, time: index <= current ? times[index] : null })),
  };
}

function buildReturnSteps(returnRequest, status) {
  const current = RETURN_STEP_INDEX[status] ?? 0;
  const times = [
    returnRequest?.requestedAt ? formatShortDateTime(returnRequest.requestedAt) : '{신청 시각}',
    returnRequest?.approvedAt ? formatShortDateTime(returnRequest.approvedAt) : '{승인 시각}',
    returnRequest?.shippedAt ? formatShortDateTime(returnRequest.shippedAt) : '{수거 시각}',
    returnRequest?.completedAt ? formatShortDateTime(returnRequest.completedAt) : '{도착 시각}',
  ];
  return {
    label: '반품 단계',
    current,
    items: RETURN_STEP_LABELS.map((label, index) => ({ label, time: index <= current ? times[index] : null })),
  };
}

// 상품 한 줄: 안내 문구 · 배지 · 버튼
function buildItem(order, sellerOrder, item, context) {
  const price = Number(item.price);
  const returnStatus = getReturnStatus(item);
  const base = {
    id: item.id,
    productId: item.productId,
    name: item.productName,
    price: formatPrice(price),
    imageUrl: item.thumbnailUrl,
    dimmed: false,
    note: null,
    badge: null,
    canReturn: false,
    canConfirm: false,
    cancel: null,
    error: context.errors[item.id] ?? null,
  };

  if (returnStatus === 'REJECTED') {
    return {
      ...base,
      note: { tone: 'success', text: '판매자가 반품을 거절해 바로 구매 확정됐어요' },
      badge: { tone: 'confirmed', label: '구매 확정' },
    };
  }
  if (returnStatus === 'COMPLETED') {
    return {
      ...base,
      dimmed: true,
      note: { tone: 'muted', text: `${formatPrice(price)}이 예치금으로 환불됐어요` },
      badge: { tone: 'closed', label: '반품 완료' },
    };
  }
  if (returnStatus === 'REQUESTED') {
    return {
      ...base,
      note: { tone: 'pending', text: '판매자가 48시간 안에 응답하지 않으면 자동으로 승인돼요' },
      badge: { tone: 'pending', label: '반품 신청' },
    };
  }
  if (returnStatus === 'APPROVED' || returnStatus === 'SHIPPING') {
    return {
      ...base,
      note: {
        tone: 'pending',
        text: `판매자에게 도착하면 ${formatPrice(price)}이 예치금으로 환불돼요 · 반품 배송비는 판매자 부담`,
      },
      badge: { tone: 'pending', label: returnStatus === 'APPROVED' ? '반품 승인' : '반품 배송 중' },
    };
  }
  if (item.status === 'CONFIRMED') {
    return { ...base, badge: { tone: 'confirmed', label: '구매 확정' } };
  }
  if (item.status === 'CANCELLED') {
    // 시안 없음: 취소된 상품은 흐리게 + 배지만
    return { ...base, dimmed: true, badge: { tone: 'closed', label: '취소됨' } };
  }

  // 진행 중(ACCEPT_PENDING · NORMAL) · 취소 중(CANCEL_PROCESSING) · 환불 확인 필요(REVIEW_REQUIRED)
  const shipment = sellerOrder.shipmentStatus;
  if (CANCELLING_ITEM_STATUSES.includes(item.status) || shipment === 'CANCEL_PENDING') {
    return {
      ...base,
      note: {
        tone: 'pending',
        text: context.duplicateCancelIds.has(item.id)
          ? '이미 취소를 요청했어요 · 확인 중이에요. 택배사 확인이 끝나면 예치금으로 환불돼요'
          : '취소 요청을 받았어요. 확인 중이에요 · 택배사 확인이 끝나면 예치금으로 환불돼요',
      },
      badge: { tone: 'pending', label: '취소 처리 중' },
    };
  }

  const beforePickup =
    isAcceptPending(sellerOrder) || shipment === 'READY' || shipment === 'BOOKED' || shipment === 'CANCEL_LOCKED';
  if (order.status === 'PAID' && beforePickup) {
    if (context.locked) {
      return {
        ...base,
        note: { tone: 'danger', text: '기사님이 수거지 근처라 취소할 수 없어요' },
        cancel: 'locked',
      };
    }
    return { ...base, cancel: 'enabled' };
  }

  if (shipment === 'DELIVERED' && sellerOrder.deliveredAt) {
    const autoConfirm = addHours(sellerOrder.deliveredAt, AUTO_CONFIRM_DAYS * 24);
    const returnDeadline = getReturnDeadline(sellerOrder);
    return {
      ...base,
      note: {
        tone: 'muted',
        text: `${formatMonthDay(autoConfirm)}에 자동으로 구매 확정돼요 · 반품은 배송 완료 후 72시간 안에 신청할 수 있어요`,
      },
      canReturn: context.now < returnDeadline.getTime(),
      canConfirm: Boolean(item.purchaseConfirmable),
    };
  }

  return { ...base, canConfirm: Boolean(item.purchaseConfirmable) };
}

function buildGroup(order, sellerOrder, index, context) {
  const sellerName = getSellerName(sellerOrder, index);
  const locked = sellerOrder.shipmentStatus === 'CANCEL_LOCKED' || context.lockedSellerOrderIds.has(sellerOrder.id);
  const items = sellerOrder.items.map((item) =>
    buildItem(order, sellerOrder, item, { ...context, locked }),
  );

  // 머리 배지: 남은 상품(취소 · 반품 완료 제외)이 모두 구매 확정이면 구매 확정, 아니면 배송 단계
  const liveItems = sellerOrder.items.filter((item) => !['CANCELLED', 'REFUNDED'].includes(item.status));
  const allConfirmed = liveItems.length > 0 && liveItems.every((item) => item.status === 'CONFIRMED');
  const allCancelled = sellerOrder.items.every((item) => item.status === 'CANCELLED');
  const acceptPending = isAcceptPending(sellerOrder);
  const shippingIndex = acceptPending ? 0 : (SHIPPING_STEP_INDEX[sellerOrder.shipmentStatus] ?? 1);
  const current = allConfirmed ? 5 : shippingIndex;

  let badge;
  if (allCancelled) badge = { tone: 'closed', label: '주문 취소' };
  else if (allConfirmed) badge = { tone: 'confirmed', label: '구매 확정' };
  else if (acceptPending) badge = { tone: 'pending', label: SHIPPING_STEP_LABELS[0] };
  else badge = { tone: 'shipping', label: SHIPPING_STEP_LABELS[shippingIndex] };

  const group = {
    key: sellerOrder.id,
    id: sellerOrder.id,
    sellerName,
    meta: `판매자 · 상품 ${sellerOrder.items.length}개 · 배송비 ${formatPrice(Number(sellerOrder.shippingFee ?? 0))}`,
    badge,
    summary: itemsText(sellerOrder.items, '개'),
    location: allCancelled || acceptPending ? null : getLocation(sellerOrder),
    headline: null,
    steps: null,
    acceptNotice: null,
    tracking: null,
    distance: null,
    items,
    invoiceNo: sellerOrder.trackingNo ?? '{송장번호}',
  };

  // 할 일(버튼) · 진행 중 안내가 있는 묶음만 펼침
  group.expanded = items.some((item) => item.canReturn || item.canConfirm || item.cancel || item.note);

  if (allCancelled) return group;

  // 반품이 있는 묶음: 반품 단계 바
  const returnItem = sellerOrder.items.find((item) => getReturnStatus(item));
  const returnStatus = returnItem && getReturnStatus(returnItem);
  if (returnItem && returnStatus !== 'REJECTED') {
    const returnRequest = returnItem.returnRequest;
    group.headline = { kind: 'delivered', time: formatShortDateTime(sellerOrder.deliveredAt) ?? '{배송 완료 시각}' };
    group.steps = buildReturnSteps(returnRequest, returnStatus);
    if (returnStatus === 'SHIPPING' || returnStatus === 'COMPLETED') {
      group.tracking = {
        invoiceLabel: '반품 송장번호',
        invoiceNo: returnRequest?.trackingNo ?? '{반품 송장번호}',
        location: getLocation(returnRequest),
      };
    }
    return group;
  }

  if (returnStatus === 'REJECTED') {
    const r = returnItem.returnRequest;
    group.headline = {
      kind: 'text',
      text: `반품 신청 ${formatShortDateTime(r?.requestedAt) ?? '{신청 시각}'} → 판매자 거절 ${formatShortDateTime(r?.rejectedAt) ?? '{거절 시각}'} · 거절돼 바로 구매 확정됐어요`,
    };
  }

  group.steps = buildShippingSteps(order, sellerOrder, current);

  if (acceptPending) {
    const deadline = order.paidAt ? formatMonthDayTime(addHours(order.paidAt, ACCEPT_WINDOW_HOURS)) : '{수락 마감 시각}';
    group.acceptNotice = `${deadline}까지 판매자가 수락하지 않으면 자동으로 취소되고 예치금으로 환불돼요`;
    return group;
  }

  const status = sellerOrder.shipmentStatus;
  if (status === 'READY') {
    group.tracking = {
      tag: { tone: 'default', label: '택배 예약 중' },
      location: '판매자가 수락했어요 · 택배 예약이 끝나면 송장번호와 기사님 위치가 보여요',
    };
    return group;
  }

  group.tracking = { invoiceLabel: '송장번호', invoiceNo: group.invoiceNo, location: getLocation(sellerOrder) };
  if (status === 'CANCEL_PENDING') {
    group.tracking.tag = { tone: 'default', label: '취소 처리 중' };
  } else if ((status === 'BOOKED' || status === 'CANCEL_LOCKED') && !allConfirmed) {
    group.tracking.tag = locked
      ? { tone: 'danger', label: '기사님 근접 · 취소 불가' }
      : { tone: 'default', label: '기사 배정 · 수거 예정' };
    // TODO: 기사님 거리 API가 생기면 값 교체 (지금은 자리 문구)
    group.distance = {
      locked,
      km: sellerOrder.driverDistanceKm != null ? `${sellerOrder.driverDistanceKm}km` : '{기사 거리}',
      checkedAt: sellerOrder.driverCheckedAt ? formatShortDateTime(sellerOrder.driverCheckedAt).slice(6) : '{조회 시각}',
    };
  }
  return group;
}

function buildRefundNote(sellerOrders) {
  // 판매자 거절(수락 전 취소) · 구매자 취소는 지금 응답에서 구분되지 않아 「취소」로 묶음
  // TODO: 응답에 취소 사유(판매자 거절 / 구매자 취소)가 생기면 시안 문구(「판매자 거절」)로 나눔
  let cancelled = 0;
  let returned = 0;
  sellerOrders.forEach((sellerOrder) => {
    sellerOrder.items.forEach((item) => {
      if (item.status === 'CANCELLED') cancelled += Number(item.price);
      if (item.status === 'REFUNDED') returned += Number(item.price);
    });
    const allGone = sellerOrder.items.every((item) => ['CANCELLED', 'REFUNDED'].includes(item.status));
    if (allGone) {
      const fee = Number(sellerOrder.shippingFee ?? 0);
      if (sellerOrder.items.every((item) => item.status === 'CANCELLED')) cancelled += fee;
      else returned += fee;
    }
  });
  const parts = [];
  if (cancelled > 0) parts.push(['취소', cancelled]);
  if (returned > 0) parts.push(['반품', returned]);
  if (parts.length === 0) return null;
  const total = cancelled + returned;
  const reason = parts.length === 1 ? parts[0][0] : parts.map(([label, amount]) => `${label} ${formatPrice(amount)}`).join(' · ');
  return `이 중 ${formatPrice(total)}은 ${reason}로 예치금에 환불됐어요`;
}

export function buildOrderDetailView(order, context = {}) {
  const ctx = {
    errors: context.errors ?? {},
    duplicateCancelIds: context.duplicateCancelIds ?? new Set(),
    lockedSellerOrderIds: context.lockedSellerOrderIds ?? new Set(),
    now: context.now ?? Date.now(),
  };
  const sellerOrders = order.sellerOrders ?? [];
  const itemTotal = sellerOrders.reduce(
    (sum, sellerOrder) => sum + sellerOrder.items.reduce((acc, item) => acc + Number(item.price), 0),
    0,
  );
  const shippingTotal = sellerOrders.reduce((sum, sellerOrder) => sum + Number(sellerOrder.shippingFee ?? 0), 0);
  const itemCount = sellerOrders.reduce((sum, sellerOrder) => sum + sellerOrder.items.length, 0);

  return {
    order: {
      orderNo: order.orderNo,
      createdAt: formatDateTime(order.createdAt),
      totalAmount: formatPrice(Number(order.totalAmount)),
      amountDetail: `상품 ${formatPrice(itemTotal)} + 배송비 ${formatPrice(shippingTotal)} (판매자 ${sellerOrders.length}곳)`,
      refundNote: buildRefundNote(sellerOrders),
      recipient: `${order.recipientName} · ${maskPhone(order.recipientPhone)}`,
      address: [order.address1, order.address2].filter(Boolean).join(', '),
    },
    itemSummary: `${itemCount}개 · 판매자 ${sellerOrders.length}곳`,
    groups: sellerOrders.map((sellerOrder, index) => buildGroup(order, sellerOrder, index, ctx)),
  };
}

/**
 * 취소 확인 모달 내용: 이 판매자의 남은 상품을 모두 취소하면 배송비도 환불 (BE cancel-refund.md)
 */
const IN_CANCELLATION_STATUSES = ['CANCEL_PROCESSING', 'CANCELLED', 'REVIEW_REQUIRED'];

export function buildCancelTarget(order, itemId) {
  for (const sellerOrder of order.sellerOrders ?? []) {
    const item = sellerOrder.items.find((candidate) => candidate.id === itemId);
    if (!item) continue;
    // BE는 판매자 주문의 모든 상품이 취소 흐름(CANCEL_PROCESSING · CANCELLED · REVIEW_REQUIRED)에 들어가면
    // 배송비도 환불함 (OrdersItem.isInCancellation, 수락 대기 ACCEPT_PENDING 상품 취소도 같음)
    const lastOne = sellerOrder.items.every(
      (candidate) => candidate.id === itemId || IN_CANCELLATION_STATUSES.includes(candidate.status),
    );
    const fee = Number(sellerOrder.shippingFee ?? 0);
    const refund = Number(item.price) + (lastOne ? fee : 0);
    return {
      itemId,
      itemName: item.productName,
      refundAmount: formatPrice(refund),
      shippingFeeNote:
        lastOne && fee > 0 ? `이 판매자의 상품을 모두 취소해 배송비 ${formatPrice(fee)}도 함께 환불돼요.` : null,
      warnPickup: sellerOrder.shipmentStatus === 'BOOKED',
    };
  }
  return null;
}

/**
 * 주문 전체 취소 (시안 03-5-2 버튼 · 03-5-3 모달): BE POST orders/{orderId}/cancel
 * BE OrderCancelTransactions.requestCancel 조건을 화면에서 미리 판단
 * - 주문이 PAID, 주문상품은 ACCEPT_PENDING · NORMAL(취소할 것) 또는 이미 취소 흐름(CANCEL_PROCESSING · CANCELLED)만
 * - 수락된 판매자 주문(NORMAL 상품)은 택배가 READY · BOOKED일 때만 (그 밖은 409 SHIPMENT_NOT_CANCELABLE)
 * 취소할 수 없으면 null
 */
const CANCEL_ALL_OPEN = ['ACCEPT_PENDING', 'NORMAL'];
const CANCEL_ALL_DONE = ['CANCEL_PROCESSING', 'CANCELLED'];
export function buildCancelAllTarget(order, lockedSellerOrderIds = new Set()) {
  if (order?.status !== 'PAID') return null;
  let count = 0;
  let sellers = 0;
  let refund = 0;
  let shipping = 0;
  for (const sellerOrder of order.sellerOrders ?? []) {
    const items = sellerOrder.items ?? [];
    if (items.some((item) => !CANCEL_ALL_OPEN.includes(item.status) && !CANCEL_ALL_DONE.includes(item.status))) return null;
    const open = items.filter((item) => CANCEL_ALL_OPEN.includes(item.status));
    if (open.length === 0) continue;
    if (open.some((item) => item.status === 'NORMAL')) {
      if (!['READY', 'BOOKED'].includes(sellerOrder.shipmentStatus)) return null;
      if (lockedSellerOrderIds.has(sellerOrder.id)) return null;
    }
    const fee = Number(sellerOrder.shippingFee ?? 0);
    count += open.length;
    sellers += 1;
    shipping += fee;
    refund += open.reduce((sum, item) => sum + Number(item.price), 0) + fee;
  }
  if (count === 0) return null;
  return {
    itemCount: count,
    summary: `${count}개 · 판매자 ${sellers}곳`,
    refundAmount: formatPrice(refund),
    shippingFeeNote: `배송비 ${formatPrice(shipping)}도 함께 환불돼요. 택배 수거가 시작된 판매자가 있으면 취소할 수 없어요.`,
  };
}

/** 구매 확정 확인 모달(시안 03-5-5)용: 상품 이름 · 상품 금액 · 자동 구매 확정일 */
export function buildConfirmTarget(order, itemId) {
  for (const sellerOrder of order.sellerOrders ?? []) {
    const item = sellerOrder.items.find((candidate) => candidate.id === itemId);
    if (!item) continue;
    const autoConfirm = sellerOrder.deliveredAt
      ? formatMonthDay(addHours(sellerOrder.deliveredAt, AUTO_CONFIRM_DAYS * 24))
      : '{자동 구매 확정일}';
    return {
      itemId,
      itemName: item.productName,
      price: formatPrice(item.price),
      autoConfirmNote: `확정하지 않아도 ${autoConfirm}에 자동으로 구매 확정돼요.`,
    };
  }
  return null;
}

/** 반품 신청 화면용: 주문에서 주문상품 · 판매자 주문 찾기 */
export function findOrderItem(order, orderItemId) {
  const sellerOrders = order.sellerOrders ?? [];
  for (let index = 0; index < sellerOrders.length; index += 1) {
    const item = sellerOrders[index].items.find((candidate) => String(candidate.id) === String(orderItemId));
    if (item) return { item, sellerOrder: sellerOrders[index], sellerIndex: index };
  }
  return null;
}
