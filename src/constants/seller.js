import { orEmpty } from './emptyText';
// 판매자 화면(시안 08 · 04 판매 주문 상세)에서 쓰는 상태 · 문구
// 판매자 화면(내 판매 목록 · 상품 수정 · 검수 결과)의 상품 상태 배지 (시안 08)
// tone: 배지 색 클래스. 검수 중은 검수 단계(응답의 reviewStatus)에 따라 라벨 · 색이 바뀜
export const SELLER_PRODUCT_BADGE = {
  ACTIVE: { label: '판매 중', tone: 'bg-[#0f4c3a] text-white' },
  PAYMENT_PENDING: { label: '거래 중', tone: 'bg-[#fffbeb] border border-[#fde68a] text-[#92400e]' },
  SOLD_OUT: { label: '판매 완료', tone: 'bg-[#e5e7eb] text-[#4b5563]' },
  REVIEW_PENDING: { label: '검수 중', tone: 'bg-[#f4f8f6] border border-[#d1e7dd] text-[#0f4c3a]' },
  MANUAL: { label: '관리자 확인 중', tone: 'bg-[#eff6ff] border border-[#bfdbfe] text-[#1d4ed8]' },
  DELAYED: { label: '확인 지연', tone: 'bg-[#fffbeb] border border-[#fde68a] text-[#92400e]' },
  REJECTED: { label: '반려', tone: 'bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c]' },
  HIDDEN: { label: '숨김', tone: 'bg-white border border-[#9ca3af] text-[#4b5563]' },
};

// 수정 · 삭제할 수 있는 상태 (백엔드 docs/services/product.md 「정책」)
export const EDITABLE_PRODUCT_STATUSES = ['ACTIVE', 'REJECTED', 'REVIEW_PENDING'];

// 검수 반려 사유 (백엔드 docs/flows/image-review.md 「관리자 수동 검수」)
export const REVIEW_REJECT_REASON = {
  NOT_PLANT: '식물 사진이 아니에요',
  HARMFUL_IMAGE: '부적절한 사진이 포함돼 있어요',
  BANNED_SPECIES: '판매 금지 품종이에요',
  PROHIBITED_FORM: '씨앗 · 삽수 · 구근은 팔 수 없어요',
  REVIEW_EXPIRED: '확인이 늦어져 반려됐어요. 다시 등록할 수 있어요',
  SPECIES_MISMATCH: '선택한 품종과 사진 속 식물이 달라요',
  UNCLEAR_IMAGE: '사진으로 상품을 확인하기 어려워요',
  INAPPROPRIATE_TEXT: '제목이나 설명에 부적절한 내용이 있어요',
};

// 반려 사유 아래 설명 (시안 08-3에 그려진 사유만. 나머지 사유의 설명은 아직 없음)
export const REVIEW_REJECT_HELP = {
  PROHIBITED_FORM:
    '흙이나 수경 용기에 심어 자라고 있는 식물만 팔 수 있어요. 뿌리 내리는 중인 줄기, 잎꽂이용 잎, 심지 않은 구근은 판매할 수 없어요.',
  SPECIES_MISMATCH: '품종을 다시 골라 주세요. 목록에 없는 식물이면 "기타"로 등록할 수 있어요.',
  REVIEW_EXPIRED:
    '판매자 잘못이 아니라서 재검수 횟수와 등록 제한에 세지 않아요. 같은 내용 그대로 다시 검수받을 수 있어요.',
};

// 등록 제한 줄 (상품 등록 · 내 판매 목록). 값은 GET products/me/counts
// 검수 중 한도(5개)는 응답에 없어 BE ProductService.REVIEW_PENDING_LIMIT 값을 그대로 씀
export const REVIEW_PENDING_LIMIT = 5;
// 하루 등록 한도 · 하루 사진 검수 한도 (BE MyProductCountResponse dailyRegisterLimit · dailyPhotoReviewLimit의 정책값).
// 응답에 한도가 없어도 같은 숫자로 보여 줌
export const DAILY_REGISTER_LIMIT = 20;
export const DAILY_PHOTO_REVIEW_LIMIT = 30;

// counts 응답 → QuotaBar 문구. counts가 없거나(불러오기 전 · 실패) 필드가 없으면 「-」
export function toQuota(counts) {
  if (!counts) {
    return {
      reviewing: `- / ${REVIEW_PENDING_LIMIT}개`,
      registeredToday: `- / ${DAILY_REGISTER_LIMIT}건`,
      reviewedToday: `- / ${DAILY_PHOTO_REVIEW_LIMIT}회`,
    };
  }
  return {
    reviewing: `${orEmpty(counts.reviewPending)} / ${REVIEW_PENDING_LIMIT}개`,
    registeredToday: `${orEmpty(counts.todayRegistered)} / ${counts.dailyRegisterLimit ?? DAILY_REGISTER_LIMIT}건`,
    reviewedToday: `${orEmpty(counts.todayPhotoReviews)} / ${counts.dailyPhotoReviewLimit ?? DAILY_PHOTO_REVIEW_LIMIT}회`,
  };
}

// ── 판매 주문 (시안 08-5 · 04 판매 주문 상세) ──

const AMBER = 'bg-[#fffbeb] border border-[#fde68a] text-[#92400e]';
const MINT = 'bg-[#f4f8f6] border border-[#d1e7dd] text-[#0f4c3a]';
const GRAY = 'bg-[#e5e7eb] text-[#4b5563]';

// 판매 주문 상태 → 목록 배지 (tone) · 상태 아래 안내 색 (noteTone)
export const SALES_ORDER_STATUS = {
  ACCEPT_PENDING: { label: '수락 대기', tone: AMBER, noteTone: 'text-[#92400e]' },
  PICKUP: { label: '픽업 대기', tone: MINT, noteTone: 'text-[#6b7280]' },
  SHIPPING: { label: '배송 중', tone: MINT, noteTone: 'text-[#6b7280]' },
  DELIVERED: { label: '배송 완료', tone: MINT, noteTone: 'text-[#6b7280]' },
  RETURN_REQUESTED: { label: '반품 신청', tone: AMBER, noteTone: 'text-[#92400e]' },
  RETURN_SHIPPING: { label: '반품 배송 중', tone: AMBER, noteTone: 'text-[#92400e]' },
  RETURNED: { label: '반품 완료', tone: GRAY, noteTone: 'text-[#6b7280]' },
  CONFIRMED: { label: '구매 확정', tone: GRAY, noteTone: 'text-[#6b7280]' },
  CANCELLED: { label: '취소', tone: GRAY, noteTone: 'text-[#6b7280]' },
  UNPAID: { label: '결제 미완료', tone: GRAY, noteTone: 'text-[#6b7280]' },
};

// 취소 주체 (백엔드 cancelledBy: BUYER · SELLER · AUTO) → 배지 라벨
export const SALES_CANCEL_LABEL = { BUYER: '구매자 취소', SELLER: '판매자 거절', AUTO: '자동 거절' };

// 판매 주문 목록 탭 (시안 08-5-1 순서). 배송 완료(구매 확정 전)는 탭이 없어 「전체」에서만 보임
// 「반품」 탭: 반품 신청 · 반품 배송 중, 반품 완료는 「취소」 탭 (구매자 주문 목록 03-4-1과 같은 규칙)
export const SALES_TABS = [
  { value: '', label: '전체' },
  { value: 'ACCEPT_PENDING', label: '수락 대기' },
  { value: 'PICKUP', label: '픽업 대기' },
  { value: 'SHIPPING', label: '배송 중' },
  { value: 'RETURN', label: '반품' },
  { value: 'CONFIRMED', label: '구매 확정' },
  { value: 'CANCELLED', label: '취소' },
];

// 목록 상태 키 → 탭
export function getSalesTab(statusKey) {
  if (statusKey === 'RETURN_REQUESTED' || statusKey === 'RETURN_SHIPPING') return 'RETURN';
  if (statusKey === 'RETURNED') return 'CANCELLED';
  return statusKey;
}

// 주문상품 반품 상태(BE OrderItemStatus) → 목록 반품 단계
const ITEM_RETURN_STAGE = {
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  RETURN_IN_TRANSIT: 'RETURN_SHIPPING',
  RETURN_PROCESSING: 'RETURN_SHIPPING', // 판매자 도착 · 환불 대기도 목록에서는 「반품 배송 중」
  RETURNED: 'RETURNED',
};
const RETURN_STAGE_ORDER = ['RETURN_REQUESTED', 'RETURN_SHIPPING', 'RETURNED']; // 덜 진행된 쪽이 먼저

/**
 * 판매 주문 목록의 상태 (반품 단계 포함)
 * - BE 목록 응답에 returnStatus(판매자 주문의 반품 단계)가 오면 그 값을 씀
 *   TODO: returnStatus · returnItemCount가 목록 응답에 생기면 로더가 상세를 부르는 임시 처리(attachSalesDetails)를 뺌
 * - 없으면 상세로 채운 items[].status로 판단: 살아 있는 상품(취소 제외)이 모두 반품 중이면 반품 단계,
 *   일부만 반품이면 배송 상태 그대로 + partialReturnCount
 * - 반품 신청(판매자 응답 필요)은 일부만이어도 「반품 신청」으로 보여 줌
 * @returns {{ key: string, partialReturnCount: number, returnStage: string|null }}
 */
export function getSalesListStatus(order) {
  const base = getSalesOrderStatus(order);
  if (['UNPAID', 'CANCELLED', 'ACCEPT_PENDING'].includes(base)) return { key: base, partialReturnCount: 0, returnStage: null };

  const fromBe = ITEM_RETURN_STAGE[order.returnStatus] ?? null;
  const items = order.items ?? [];
  const live = items.filter((item) => item.status !== 'CANCELLED');
  const returning = live.filter((item) => ITEM_RETURN_STAGE[item.status]);
  const stages = returning.map((item) => ITEM_RETURN_STAGE[item.status]);
  const earliest = RETURN_STAGE_ORDER.find((stage) => stages.includes(stage)) ?? null;

  if (base === 'RETURN_REQUESTED') return { key: 'RETURN_REQUESTED', partialReturnCount: 0, returnStage: 'RETURN_REQUESTED' };
  if (fromBe) {
    const count = Number(order.returnItemCount ?? 0);
    const all = !order.itemCount || !count || count >= order.itemCount;
    return all
      ? { key: fromBe, partialReturnCount: 0, returnStage: fromBe }
      : { key: base, partialReturnCount: count, returnStage: fromBe };
  }
  if (returning.length > 0 && returning.length === live.length) {
    return { key: earliest, partialReturnCount: 0, returnStage: earliest };
  }
  return { key: base, partialReturnCount: returning.length, returnStage: earliest };
}

// 배송 단계 (시안 04 판매 주문 상세)
export const SALES_SHIPMENT_STEPS = ['픽업 대기', '수거', '배송 중', '배송 완료', '구매 확정'];

// 수수료율 (백엔드 settlement 정책: 판매액의 5%, 원 단위 미만 버림)
export const SETTLEMENT_FEE_RATE = 0.05;

/**
 * 판매 주문 상태 키(SALES_ORDER_STATUS)를 계산
 * 수락 대기: 주문 상태(OrderStatus)에는 없고, 목록은 acceptPending(boolean),
 *           상세는 items[].status === 'ACCEPT_PENDING'으로 옴 (BE SellerOrderResponse · SellerOrderDetailResponse)
 * 반품 신청: 목록은 returnRequested(boolean, 판매자 응답 전 반품 신청이 있음),
 *           상세는 items[].status === 'RETURN_REQUESTED'(BE OrderItemStatus)로 옴 (#593)
 */
export function getSalesOrderStatus(order) {
  // 결제가 끝나지 않은 주문 (BE OrderStatus): 목록에서는 로더가 거르고, 상세로 직접 오면 「결제 미완료」
  if (['PAYMENT_PENDING', 'PAYMENT_PROCESSING', 'PAYMENT_FAILED', 'EXPIRED'].includes(order.status)) return 'UNPAID';
  if (order.status === 'CANCELLED') return 'CANCELLED';
  if (
    order.acceptPending ||
    order.status === 'ACCEPT_PENDING' ||
    (order.items ?? []).some((item) => item.status === 'ACCEPT_PENDING')
  ) {
    return 'ACCEPT_PENDING';
  }
  const items = order.items ?? [];
  if (order.returnRequested || items.some((item) => item.status === 'RETURN_REQUESTED')) {
    return 'RETURN_REQUESTED';
  }
  if (order.status === 'COMPLETED' || order.confirmedAt) return 'CONFIRMED';
  const liveItems = items.filter((item) => item.status !== 'CANCELLED');
  if (liveItems.length > 0 && liveItems.every((item) => item.status === 'CONFIRMED')) return 'CONFIRMED';
  switch (order.shipmentStatus) {
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      return 'SHIPPING';
    case 'DELIVERED':
      return 'DELIVERED';
    default:
      return 'PICKUP';
  }
}

// 판매 주문 상세의 배송 단계 위치 (SALES_SHIPMENT_STEPS 인덱스)
export function getSalesShipmentStep(order, salesStatus) {
  if (salesStatus === 'CONFIRMED') return 4;
  switch (order.shipmentStatus) {
    case 'PICKED_UP':
      return 1;
    case 'IN_TRANSIT':
      return 2;
    case 'DELIVERED':
      return 3;
    default:
      return 0;
  }
}

// 정산 상태 (백엔드 SETTLEMENT.status) → 배지 라벨 · 색
export const SETTLEMENT_STATUS = {
  PENDING: { label: '지급 대기', tone: 'bg-white border border-[#0f4c3a] text-[#0f4c3a]' },
  FAILED: { label: '지급 대기', tone: 'bg-white border border-[#0f4c3a] text-[#0f4c3a]' },
  COMPLETED: { label: '지급 완료', tone: GRAY },
};

// 수락 · 반품 응답 기한 (docs/services/market.md 「정책」)
export const ACCEPT_HOURS = 24;
export const RETURN_RESPONSE_HOURS = 48;
