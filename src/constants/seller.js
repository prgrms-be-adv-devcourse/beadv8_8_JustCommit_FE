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

// counts 응답 → QuotaBar 문구. counts가 없으면(불러오기 전 · 실패) 「-」
export function toQuota(counts) {
  if (!counts) {
    return { reviewing: `- / ${REVIEW_PENDING_LIMIT}개`, registeredToday: '- / 20건', reviewedToday: '- / 30회' };
  }
  return {
    reviewing: `${counts.reviewPending} / ${REVIEW_PENDING_LIMIT}개`,
    registeredToday: `${counts.todayRegistered} / ${counts.dailyRegisterLimit}건`,
    reviewedToday: `${counts.todayPhotoReviews} / ${counts.dailyPhotoReviewLimit}회`,
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
  CONFIRMED: { label: '구매 확정', tone: GRAY, noteTone: 'text-[#6b7280]' },
  CANCELLED: { label: '취소', tone: GRAY, noteTone: 'text-[#6b7280]' },
};

// 취소 주체 (백엔드 cancelledBy: BUYER · SELLER · AUTO) → 배지 라벨
export const SALES_CANCEL_LABEL = { BUYER: '구매자 취소', SELLER: '판매자 거절', AUTO: '자동 거절' };

// 판매 주문 목록 탭 (시안 08-5-1 순서). 배송 완료(구매 확정 전)는 탭이 없어 「전체」에서만 보임
export const SALES_TABS = [
  { value: '', label: '전체' },
  { value: 'ACCEPT_PENDING', label: '수락 대기' },
  { value: 'PICKUP', label: '픽업 대기' },
  { value: 'SHIPPING', label: '배송 중' },
  { value: 'RETURN_REQUESTED', label: '반품 신청' },
  { value: 'CONFIRMED', label: '구매 확정' },
  { value: 'CANCELLED', label: '취소' },
];

// 배송 단계 (시안 04 판매 주문 상세)
export const SALES_SHIPMENT_STEPS = ['픽업 대기', '수거', '배송 중', '배송 완료', '구매 확정'];

// 수수료율 (백엔드 settlement 정책: 판매액의 5%, 원 단위 미만 버림)
export const SETTLEMENT_FEE_RATE = 0.05;

/**
 * 판매 주문 상태 키(SALES_ORDER_STATUS)를 계산
 * 수락 대기: 주문 상태(OrderStatus)에는 없고, 목록은 acceptPending(boolean),
 *           상세는 items[].status === 'ACCEPT_PENDING'으로 옴 (BE SellerOrderResponse · SellerOrderDetailResponse)
 * TODO: 백엔드 반품 신청 상태가 생기면 필드명을 확인
 */
export function getSalesOrderStatus(order) {
  if (order.status === 'CANCELLED') return 'CANCELLED';
  if (
    order.acceptPending ||
    order.status === 'ACCEPT_PENDING' ||
    (order.items ?? []).some((item) => item.status === 'ACCEPT_PENDING')
  ) {
    return 'ACCEPT_PENDING';
  }
  const items = order.items ?? [];
  if (order.returnRequested || items.some((item) => item.status === 'REFUND_REQUESTED')) {
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
