import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getOrder, getOrders, mapWithLimit, withSellerNicknames } from '../../api/orderApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate, formatPrice, formatTime, toValidDate } from '../../utils/format';
import { EMPTY } from '../../constants/emptyText';
import OrderListView from './OrderListView';

// 시안 03-4 주문 목록
// 탭은 주문 단위가 아니라 판매자 주문 단계로 셈 (판매자가 여럿이면 한 주문이 여러 탭에 들어감)

const TABS = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '결제 대기' },
  { value: 'ACCEPT', label: '판매자 확인 중' },
  { value: 'SHIPPING', label: '배송' },
  { value: 'CONFIRMED', label: '구매 확정' },
  { value: 'CANCELLED', label: '취소' },
];

const PAGE_SIZE = 50; // 백엔드 PagingRequest.MAX_SIZE
const MAX_PAGES = 10; // 안전장치: 최대 500건까지
const PAYMENT_WINDOW_MS = 10 * 60 * 1000; // 결제 대기 10분 (주문 생성 시각부터)
const AUTO_CONFIRM_MS = 72 * 60 * 60 * 1000; // 배송 완료 후 72시간 뒤 자동 구매 확정
const ACCEPT_WINDOW_MS = 24 * 60 * 60 * 1000; // 결제 완료 후 24시간 안에 판매자 수락

// TODO: 백엔드에 상태 조건 · 탭별 개수 조회가 생기면 페이지 단위 조회로 교체
async function fetchAllOrders() {
  const all = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await getOrders({ page, size: PAGE_SIZE });
    const data = response.data.data ?? response.data; // 주문 API는 DTO를 그대로 반환
    all.push(...data.content);
    if (page + 1 >= data.totalPages) break;
  }
  return all;
}

const DETAIL_CONCURRENCY = 4; // 주문 상세를 동시에 부르는 수

const LIVE_ITEM = (item) => !['CANCELLED', 'RETURNED'].includes(item.status);

// 반품 중인 주문상품 상태 (BE OrderItemStatus) → 목록 반품 단계. 진행이 가장 덜 된 상품 기준
const RETURN_STAGE_BY_ITEM_STATUS = {
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  RETURN_IN_TRANSIT: 'RETURN_SHIPPING',
  RETURN_PROCESSING: 'RETURN_SHIPPING',
  RETURNED: 'RETURNED',
};
const RETURN_STAGE_ORDER = ['RETURN_REQUESTED', 'RETURN_SHIPPING', 'RETURNED'];

// 판매자 주문의 반품: 취소되지 않은 상품이 모두 반품 중이면 그 단계(returnStage), 일부만이면 반품 건수(partialReturnCount)
function getReturnInfo(items) {
  const notCancelled = items.filter((item) => item.status !== 'CANCELLED');
  const returning = notCancelled.filter((item) => RETURN_STAGE_BY_ITEM_STATUS[item.status]);
  if (returning.length === 0) return { returnStage: null, partialReturnCount: 0 };
  if (returning.length < notCancelled.length) return { returnStage: null, partialReturnCount: returning.length };
  const stages = returning.map((item) => RETURN_STAGE_BY_ITEM_STATUS[item.status]);
  const returnStage = RETURN_STAGE_ORDER.find((stage) => stages.includes(stage));
  return { returnStage, partialReturnCount: 0 };
}

// 주문 상세의 판매자 주문 → 목록 카드 한 줄에 쓰는 값 (BE OrderDetailResponse.SellerOrderDetail)
// 판매자 주문 상태는 응답에 없어 주문상품 상태로 정함: 모두 취소 → CANCELLED, 수락 대기 상품 → ACCEPT_PENDING,
// 남은 상품이 모두 구매 확정 → CONFIRMED (주문 상세 화면 orderDetailModel과 같은 기준)
// 취소 사유(판매자 거절 · 자동 취소 · 구매자 취소) · 결제 완료 시각은 응답에 없어 넣지 않음
function toListSellerOrder(sellerOrder) {
  const items = sellerOrder.items ?? [];
  const liveItems = items.filter(LIVE_ITEM);
  let status = null;
  if (items.length > 0 && items.every((item) => item.status === 'CANCELLED')) status = 'CANCELLED';
  else if (items.some((item) => item.status === 'ACCEPT_PENDING')) status = 'ACCEPT_PENDING';
  else if (liveItems.length > 0 && liveItems.every((item) => item.status === 'CONFIRMED')) status = 'CONFIRMED';
  const cancelledAmount = items
    .filter((item) => item.status === 'CANCELLED')
    .reduce((sum, item) => sum + Number(item.price), 0);
  return {
    ...getReturnInfo(items),
    sellerOrderId: sellerOrder.id,
    sellerName: sellerOrder.sellerNickname,
    representativeItemName: items[0]?.productName,
    itemCount: items.length,
    thumbnailUrl: items[0]?.thumbnailUrl,
    status,
    shipmentStatus: sellerOrder.shipmentStatus,
    deliveredAt: sellerOrder.deliveredAt,
    confirmedAt: sellerOrder.confirmedAt,
    // 환불 금액: 취소된 상품 금액 (+ 모두 취소면 배송비, BE cancel-refund.md)
    refundAmount: cancelledAmount + (status === 'CANCELLED' ? Number(sellerOrder.shippingFee ?? 0) : 0),
  };
}

// 주문 목록 응답에는 판매자 주문이 없어 주문 상세(GET orders/{id}) + 판매자 닉네임으로 채움
// 상세를 못 불러온 주문은 목록 응답 그대로 (없는 값은 「-」)
async function attachSellerOrders(orders) {
  return mapWithLimit(orders, DETAIL_CONCURRENCY, async (order) => {
    try {
      const response = await getOrder(order.orderId);
      const detail = await withSellerNicknames(response.data.data ?? response.data);
      const sellerOrders = (detail.sellerOrders ?? []).map(toListSellerOrder);
      return { ...order, sellerCount: sellerOrders.length || null, sellerOrders };
    } catch {
      return order;
    }
  });
}

// "10월 15일 14:20"
function formatMonthDayTime(ms) {
  const date = toValidDate(ms);
  if (!date) return EMPTY;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hours}:${minutes}`;
}

// "10월 11일"
function formatMonthDay(ms) {
  const date = toValidDate(ms);
  if (!date) return EMPTY;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 판매자 주문 단계 (배지 · 탭 · 안내)
const STAGES = {
  ACCEPT: { badge: { label: '판매자 확인 중', tone: 'amber' }, tab: 'ACCEPT' },
  PICKUP: { badge: { label: '픽업 대기', tone: 'green' }, tab: 'SHIPPING' },
  SHIPPING: { badge: { label: '배송 중', tone: 'green' }, tab: 'SHIPPING' },
  DELIVERED: { badge: { label: '배송 완료', tone: 'green' }, tab: 'SHIPPING' },
  CONFIRMED: { badge: { label: '구매 확정', tone: 'dark' }, tab: 'CONFIRMED' },
  // 반품 (시안 03-4-1): 진행 중은 배송 탭, 반품 완료는 취소 탭
  RETURN_REQUESTED: { badge: { label: '반품 신청', tone: 'amber' }, tab: 'SHIPPING' },
  RETURN_SHIPPING: { badge: { label: '반품 배송 중', tone: 'amber' }, tab: 'SHIPPING' },
  RETURNED: { badge: { label: '반품 완료', tone: 'gray' }, tab: 'CANCELLED', muted: true },
  REJECTED: { badge: { label: '판매자 거절', tone: 'gray' }, tab: 'CANCELLED', muted: true },
  AUTO_CANCELLED: { badge: { label: '자동 취소', tone: 'gray' }, tab: 'CANCELLED', muted: true },
  CANCELLED: { badge: { label: '주문 취소', tone: 'gray' }, tab: 'CANCELLED', muted: true },
  UNKNOWN: { badge: { label: '진행 중', tone: 'green' }, tab: 'SHIPPING' }, // 배송 상태를 모를 때 일반 배지
};

// 판매자 주문 → 단계
// 판매자 주문(sellerOrders[])은 주문 목록 응답에 없어 주문 상세로 채움(attachSellerOrders → toListSellerOrder)
// TODO: 응답에 없는 값 cancelReason(SELLER · AUTO · BUYER) · paidAt · cancelledItemCount(판매자 거절 건수)는 BE에 생기면 넣음
function getStage(sellerOrder) {
  if (sellerOrder.status === 'CANCELLED') {
    if (sellerOrder.cancelReason === 'AUTO') return 'AUTO_CANCELLED';
    if (sellerOrder.cancelReason === 'SELLER') return 'REJECTED';
    return 'CANCELLED';
  }
  if (sellerOrder.status === 'ACCEPT_PENDING') return 'ACCEPT';
  // 반품: 가는 배송이 배송 완료여도 반품 단계가 먼저 (반품 중에는 자동 구매 확정 안내를 보이지 않음)
  if (sellerOrder.returnStage) return sellerOrder.returnStage;
  if (sellerOrder.confirmedAt || sellerOrder.status === 'CONFIRMED') return 'CONFIRMED';
  switch (sellerOrder.shipmentStatus) {
    case 'READY':
    case 'BOOKED':
    case 'CANCEL_LOCKED': // 기사님 근접(취소 불가) · 취소 결과 대기도 픽업 전 단계 (orderDetailModel SHIPPING_STEP_INDEX)
    case 'CANCEL_PENDING':
      return 'PICKUP';
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      return 'SHIPPING';
    case 'DELIVERED':
      return 'DELIVERED';
    default:
      return 'UNKNOWN';
  }
}

function getStageNote(stage, sellerOrder) {
  // 환불 금액이 없으면 금액만 빼고 안내
  const refund = sellerOrder.refundAmount != null ? `${formatPrice(Number(sellerOrder.refundAmount))}이 ` : '';
  if (stage !== 'REJECTED' && stage !== 'AUTO_CANCELLED' && sellerOrder.cancelledItemCount > 0) {
    const count = sellerOrder.cancelledItemCount;
    return { strong: `일부 취소 ${count}건`, text: `판매자가 ${count}건을 거절해 ${refund}예치금으로 환불됐어요` };
  }
  if (sellerOrder.partialReturnCount > 0) {
    const count = sellerOrder.partialReturnCount;
    if (stage === 'DELIVERED') {
      const date = sellerOrder.deliveredAt
        ? `${formatMonthDay(new Date(sellerOrder.deliveredAt).getTime() + AUTO_CONFIRM_MS)}에`
        : `배송 완료 ${AUTO_CONFIRM_MS / (24 * 60 * 60 * 1000)}일 뒤`;
      return { strong: `일부 반품 ${count}건`, text: `반품하지 않은 상품은 ${date} 자동으로 구매 확정돼요` };
    }
    const base = getStageNote(stage, { ...sellerOrder, partialReturnCount: 0 });
    // 다른 단계 안내가 없으면(예: 구매 확정) 건수만
    return base ? { strong: `일부 반품 ${count}건`, text: base.text } : { tone: 'gray', text: `일부 반품 ${count}건` };
  }
  switch (stage) {
    case 'ACCEPT': {
      // 결제 시각이 없으면 마감 시각 없이 안내
      const deadline = sellerOrder.paidAt
        ? `${formatMonthDayTime(new Date(sellerOrder.paidAt).getTime() + ACCEPT_WINDOW_MS)}까지 `
        : '';
      return { tone: 'amber', text: `${deadline}판매자가 수락하지 않으면 자동으로 취소되고 예치금으로 환불돼요` };
    }
    case 'PICKUP':
      return { tone: 'gray', text: '택배사가 곧 상품을 가지러 가요' };
    case 'DELIVERED': {
      // 배송 완료 시각이 없으면 날짜 없이 안내
      const date = sellerOrder.deliveredAt
        ? `${formatMonthDay(new Date(sellerOrder.deliveredAt).getTime() + AUTO_CONFIRM_MS)}에`
        : `배송 완료 ${AUTO_CONFIRM_MS / (24 * 60 * 60 * 1000)}일 뒤`;
      return { tone: 'gray', text: `${date} 자동으로 구매 확정돼요` };
    }
    case 'RETURN_REQUESTED':
      return { tone: 'gray', text: '판매자가 반품 신청을 확인하고 있어요' };
    case 'RETURN_SHIPPING':
      return { tone: 'gray', text: '반품 상품이 판매자에게 가고 있어요' };
    case 'RETURNED':
      return { tone: 'gray', text: '반품이 끝나 환불됐어요' };
    case 'REJECTED':
      return { tone: 'gray', text: `판매자가 주문을 거절해 ${refund}예치금으로 환불됐어요` };
    case 'AUTO_CANCELLED':
      return { tone: 'gray', text: `판매자가 24시간 안에 수락하지 않아 ${refund}예치금으로 환불됐어요` };
    default:
      return null;
  }
}

function getRemainingSeconds(order, now) {
  const expiresAt = order.expiresAt
    ? new Date(order.expiresAt).getTime()
    : new Date(order.createdAt).getTime() + PAYMENT_WINDOW_MS;
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

// 주문 목록 응답 → 화면 카드 + 들어갈 탭
function toCard(order, now) {
  const base = {
    orderId: order.orderId,
    dateText: formatDate(order.createdAt),
    orderNo: order.orderNo,
    totalAmount: Number(order.totalAmount),
  };
  const sellerOrders = order.sellerOrders ?? [];
  const sellerCount = order.sellerCount ?? (sellerOrders.length || null);
  const summaryRow = {
    key: 'summary',
    itemName: order.representativeItemName,
    moreCount: (order.itemCount ?? 1) - 1,
    thumbnailUrl: order.thumbnailUrl,
  };

  // 결제 대기: 주문 전체를 한 줄로 + 남은 시간 + 이어서 결제하기
  if (order.status === 'PAYMENT_PENDING') {
    return {
      ...base,
      tabs: ['PENDING'],
      headerBadge: { label: '결제 대기', tone: 'pending' },
      rows: [{ ...summaryRow, sellerText: sellerCount ? `판매자 ${sellerCount}곳` : `판매자 ${EMPTY}곳` }],
      footerNote: {
        tone: 'red',
        text: `남은 시간 ${formatTime(getRemainingSeconds(order, now))} · 10분 안에 결제하지 않으면 주문이 취소돼요`,
      },
      payTo: `/checkout?orderId=${order.orderId}`,
    };
  }

  // 결제 시간 만료 · 결제 실패: 주문 전체를 한 줄로, 흐리게
  if (order.status === 'EXPIRED' || order.status === 'PAYMENT_FAILED') {
    const expired = order.status === 'EXPIRED';
    return {
      ...base,
      tabs: ['CANCELLED'],
      headerBadge: { label: expired ? '결제 시간 만료' : '결제 실패', tone: 'gray' },
      rows: [
        {
          ...summaryRow,
          sellerText: sellerOrders[0]?.sellerName ?? (sellerCount > 1 ? `판매자 ${sellerCount}곳` : EMPTY),
          muted: true,
        },
      ],
      footerNote: expired
        ? { tone: 'gray', text: '10분 안에 결제하지 않아 주문이 취소됐어요 · 예치금은 빠져나가지 않았어요' }
        : null,
    };
  }

  // 판매자 주문 정보가 아직 없으면 주문 상태로 한 줄 (TODO: sellerOrders가 생기면 이 분기는 안 탐)
  if (sellerOrders.length === 0) {
    let stage = 'UNKNOWN';
    if (order.status === 'COMPLETED') stage = 'CONFIRMED';
    if (order.status === 'CANCELLED') stage = 'CANCELLED';
    return {
      ...base,
      tabs: [STAGES[stage].tab],
      rows: [
        { ...summaryRow, sellerText: EMPTY, muted: STAGES[stage].muted, badge: STAGES[stage].badge },
      ],
    };
  }

  const rows = sellerOrders.map((sellerOrder, index) => {
    const stage = getStage(sellerOrder);
    return {
      key: sellerOrder.sellerOrderId ?? index,
      stage,
      sellerText: sellerOrder.sellerName ?? EMPTY,
      itemName: sellerOrder.representativeItemName,
      moreCount: (sellerOrder.itemCount ?? 1) - 1,
      thumbnailUrl: sellerOrder.thumbnailUrl,
      muted: STAGES[stage].muted,
      note: getStageNote(stage, sellerOrder),
      badge: STAGES[stage].badge,
    };
  });
  return {
    ...base,
    tabs: [...new Set(rows.map((row) => STAGES[row.stage].tab))],
    headerText: rows.length > 1 ? `판매자 ${rows.length}곳` : null,
    rows,
  };
}

function OrderListPage() {
  usePageTitle('주문 목록');
  const { isLoggedIn, isInitializing } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error
  const [tabValue, setTabValue] = useState('ALL');
  const [expandedIds, setExpandedIds] = useState([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isLoggedIn) return undefined;

    let ignore = false;
    fetchAllOrders()
      .then((list) => {
        if (ignore) return;
        setOrders(list);
        setLoadState('done');
        // 판매자 이름 · 배송 단계는 주문 상세로 채운 뒤 다시 그림 (실패해도 목록은 그대로)
        attachSellerOrders(list).then((enriched) => {
          if (!ignore) setOrders(enriched);
        });
      })
      .catch(() => {
        if (!ignore) setLoadState('error');
      });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  // 결제 대기 주문이 있으면 남은 시간을 1초마다 갱신
  const hasPending = orders.some((order) => order.status === 'PAYMENT_PENDING');
  useEffect(() => {
    if (!hasPending) return undefined;
    const timerId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timerId);
  }, [hasPending]);

  if (isInitializing) {
    return <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-8 pb-16 text-[14px] text-[#6b7280]">불러오는 중...</main>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/orders' }} />;
  }

  const cards = orders.map((order) => toCard(order, now));
  const tabs = TABS.map((tab) => ({
    ...tab,
    count: loadState === 'done' ? cards.filter((card) => tab.value === 'ALL' || card.tabs.includes(tab.value)).length : null,
  }));
  const visibleCards = cards.filter((card) => tabValue === 'ALL' || card.tabs.includes(tabValue));

  let message = null;
  if (loadState === 'loading') message = '주문 목록을 불러오는 중...';
  if (loadState === 'error') message = '주문 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

  return (
    <OrderListView
      tabs={tabs}
      selectedTab={tabValue}
      cards={visibleCards}
      expandedIds={expandedIds}
      message={message}
      onSelectTab={setTabValue}
      onExpand={(orderId) => setExpandedIds((prev) => [...prev, orderId])}
    />
  );
}

export default OrderListPage;
