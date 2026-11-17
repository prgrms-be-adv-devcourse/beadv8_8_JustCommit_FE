import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getOrders } from '../../api/orderApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate, formatPrice, formatTime } from '../../utils/format';
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

// "10월 15일 14:20"
function formatMonthDayTime(ms) {
  const date = new Date(ms);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hours}:${minutes}`;
}

// "10월 11일"
function formatMonthDay(ms) {
  const date = new Date(ms);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 판매자 주문 단계 (배지 · 탭 · 안내)
const STAGES = {
  ACCEPT: { badge: { label: '판매자 확인 중', tone: 'amber' }, tab: 'ACCEPT' },
  PICKUP: { badge: { label: '픽업 대기', tone: 'green' }, tab: 'SHIPPING' },
  SHIPPING: { badge: { label: '배송 중', tone: 'green' }, tab: 'SHIPPING' },
  DELIVERED: { badge: { label: '배송 완료', tone: 'green' }, tab: 'SHIPPING' },
  CONFIRMED: { badge: { label: '구매 확정', tone: 'dark' }, tab: 'CONFIRMED' },
  REJECTED: { badge: { label: '판매자 거절', tone: 'gray' }, tab: 'CANCELLED', muted: true },
  AUTO_CANCELLED: { badge: { label: '자동 취소', tone: 'gray' }, tab: 'CANCELLED', muted: true },
  CANCELLED: { badge: { label: '주문 취소', tone: 'gray' }, tab: 'CANCELLED', muted: true },
  UNKNOWN: { badge: { label: '{배송 상태}', tone: 'green' }, tab: 'SHIPPING' },
};

// 판매자 주문 → 단계
// TODO: 주문 목록 응답에 판매자 주문(sellerOrders[])이 아직 없음. 생기면 아래 필드 이름을 확인
//  { sellerName, representativeItemName, itemCount, thumbnailUrl, status, cancelReason(SELLER · AUTO · BUYER),
//    shipmentStatus, paidAt, deliveredAt, confirmedAt, cancelledItemCount, refundAmount }
function getStage(sellerOrder) {
  if (sellerOrder.status === 'CANCELLED') {
    if (sellerOrder.cancelReason === 'AUTO') return 'AUTO_CANCELLED';
    if (sellerOrder.cancelReason === 'SELLER') return 'REJECTED';
    return 'CANCELLED';
  }
  if (sellerOrder.status === 'ACCEPT_PENDING') return 'ACCEPT';
  if (sellerOrder.confirmedAt || sellerOrder.status === 'CONFIRMED') return 'CONFIRMED';
  switch (sellerOrder.shipmentStatus) {
    case 'READY':
    case 'BOOKED':
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
  const refund = sellerOrder.refundAmount != null ? formatPrice(Number(sellerOrder.refundAmount)) : '{환불 금액}';
  if (stage !== 'REJECTED' && stage !== 'AUTO_CANCELLED' && sellerOrder.cancelledItemCount > 0) {
    const count = sellerOrder.cancelledItemCount;
    return { strong: `일부 취소 ${count}건`, text: `판매자가 ${count}건을 거절해 ${refund}이 예치금으로 환불됐어요` };
  }
  switch (stage) {
    case 'ACCEPT': {
      const deadline = sellerOrder.paidAt
        ? formatMonthDayTime(new Date(sellerOrder.paidAt).getTime() + ACCEPT_WINDOW_MS)
        : '{수락 마감 시각}';
      return { tone: 'amber', text: `${deadline}까지 판매자가 수락하지 않으면 자동으로 취소되고 예치금으로 환불돼요` };
    }
    case 'PICKUP':
      return { tone: 'gray', text: '택배사가 곧 상품을 가지러 가요' };
    case 'DELIVERED': {
      const date = sellerOrder.deliveredAt
        ? formatMonthDay(new Date(sellerOrder.deliveredAt).getTime() + AUTO_CONFIRM_MS)
        : '{자동 구매 확정일}';
      return { tone: 'gray', text: `${date}에 자동으로 구매 확정돼요` };
    }
    case 'REJECTED':
      return { tone: 'gray', text: `판매자가 주문을 거절해 ${refund}이 예치금으로 환불됐어요` };
    case 'AUTO_CANCELLED':
      return { tone: 'gray', text: `판매자가 24시간 안에 수락하지 않아 ${refund}이 예치금으로 환불됐어요` };
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
      rows: [{ ...summaryRow, sellerText: sellerCount ? `판매자 ${sellerCount}곳` : '{판매자 수}' }],
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
          sellerText: sellerOrders[0]?.sellerName ?? (sellerCount > 1 ? `판매자 ${sellerCount}곳` : '{판매자 이름}'),
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
        { ...summaryRow, sellerText: '{판매자 이름}', muted: STAGES[stage].muted, badge: STAGES[stage].badge },
      ],
    };
  }

  const rows = sellerOrders.map((sellerOrder, index) => {
    const stage = getStage(sellerOrder);
    return {
      key: sellerOrder.sellerOrderId ?? index,
      stage,
      sellerText: sellerOrder.sellerName ?? '{판매자 이름}',
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
