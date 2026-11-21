// 반품 단계 (시안 04-4-1 ~ 04-4-3 구매자 주문 상세 · 04-5-1 판매자 판매 주문 상세, 두 화면이 같은 단계 바를 씀)
// BE OrderItemStatus: RETURN_REQUESTED(신청) → RETURN_IN_TRANSIT(승인되어 반품 택배 진행) → RETURN_PROCESSING(판매자 도착 · 환불 대기) → RETURNED(환불 완료)
export const RETURN_STEP_LABELS = ['반품 신청', '판매자 승인', '반품 수거', '반품 배송 중', '판매자 도착', '환불 완료'];

// 반품 택배 상태(BE ShipmentStatus)가 응답에 생기면 승인 뒤 단계를 더 나눔. 지금은 RETURN_IN_TRANSIT = 판매자 승인
const RETURN_SHIPMENT_STEP = { PICKED_UP: 2, IN_TRANSIT: 3, DELIVERED: 4 };

// 반품 중인 주문상품 상태
export const RETURN_ITEM_STATUSES = ['RETURN_REQUESTED', 'RETURN_IN_TRANSIT', 'RETURN_PROCESSING', 'RETURNED'];

export function getReturnStepIndex(item) {
  switch (item?.status) {
    case 'RETURN_REQUESTED':
      return 0;
    case 'RETURN_IN_TRANSIT':
      return RETURN_SHIPMENT_STEP[item.returnShipmentStatus] ?? 1;
    case 'RETURN_PROCESSING':
      return 4;
    case 'RETURNED':
      return 5;
    default:
      return null;
  }
}

const pad = (value) => String(value).padStart(2, '0');

// "10.14 10:12" (값이 없거나 날짜가 아니면 null → 단계 아래 시각을 숨김)
function shortTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// 단계별 시각: 응답에 있는 것만 (지금 BE는 returnRequestedAt만 판매자 상세에 줌, 나머지는 BE 추가 전까지 비어 있음)
const RETURN_TIME_FIELDS = [
  'returnRequestedAt',
  'returnDecidedAt',
  'returnPickedUpAt',
  'returnInTransitAt',
  'returnArrivedAt',
  'returnedAt',
];

/**
 * 반품 단계 바 데이터 (StepBar props). 반품 중이 아니면 null
 * fallback: 주문상품 응답에 시각이 없을 때 쓸 값 (예: 구매자 화면의 returnRequest.requestedAt)
 */
export function buildReturnTimeline(item, fallback = {}) {
  const current = getReturnStepIndex(item);
  if (current === null) return null;
  return {
    label: '반품 단계',
    current,
    items: RETURN_STEP_LABELS.map((label, index) => {
      const raw = item[RETURN_TIME_FIELDS[index]] ?? fallback[RETURN_TIME_FIELDS[index]];
      return { label, time: index <= current ? shortTime(raw) : null };
    }),
  };
}

// 반품 택배 단계(승인 뒤): 이때부터 배송 카드의 송장 · 배송 조회는 가는 배송이 아니라 반품 택배 기준
// BE #606: items[].returnShipmentStatus · returnTrackingNo가 있거나, 주문상품이 반품 택배 상태면 반품 택배 단계
const RETURN_SHIPPING_ITEM_STATUSES = ['RETURN_IN_TRANSIT', 'RETURN_PROCESSING', 'RETURNED'];

export function isReturnShipping(item) {
  if (!item) return false;
  return item.returnShipmentStatus != null || item.returnTrackingNo != null || RETURN_SHIPPING_ITEM_STATUSES.includes(item.status);
}

// 반품 택배의 가장 최근 단계 (현재 위치 줄 · 배송 조회 모달 첫 줄)
function latestReturnStep(item) {
  if (item.returnArrivedAt) return ['판매자 도착', item.returnArrivedAt];
  if (item.returnInTransitAt) return ['반품 배송 중', item.returnInTransitAt];
  if (item.returnPickedUpAt) return ['반품 수거 완료', item.returnPickedUpAt];
  return ['기사 배정', item.returnBookedAt ?? item.returnDriverCheckedAt];
}

// 반품 송장 줄의 「현재 위치: 지점 · 단계 · 시각」 (시안 04-4-2 · 04-4-5 · 04-5-4 · 04-5-5). 지점을 모르면 null → 숨김
export function buildReturnLocation(item) {
  if (!item?.returnCurrentLocation) return null;
  const [status, at] = latestReturnStep(item);
  return [item.returnCurrentLocation, status, shortTime(at)].filter(Boolean).join(' · ');
}

// 반품 수거 전 기사님 거리 (반품 택배 조회 #621, 수거 전에만 값). 없으면 null → 박스를 숨김
export function buildReturnDistance(item) {
  if (item?.returnDriverDistanceKm == null) return null;
  const checked = shortTime(item.returnDriverCheckedAt);
  return { km: `${item.returnDriverDistanceKm}km`, checkedAt: checked ? checked.slice(6) : null };
}

// 배송 조회 모달용 반품 택배 단계 목록 (최신이 먼저, 시각이 있는 단계만). 첫 줄에 현재 위치(있으면)
export function buildReturnShipmentEvents(item) {
  if (!item) return [];
  const events = [
    ['returnArrivedAt', '판매자 도착'],
    ['returnInTransitAt', '반품 배송 중'],
    ['returnPickedUpAt', '반품 수거'],
    ['returnBookedAt', '반품 택배 예약'],
  ]
    .filter(([key]) => shortTime(item[key]))
    .map(([key, status]) => ({ time: shortTime(item[key]), status, location: null }));
  if (events.length && item.returnCurrentLocation) events[0].location = item.returnCurrentLocation;
  return events;
}
