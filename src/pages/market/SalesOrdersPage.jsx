import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import ErrorPage from '../../components/common/ErrorPage';
import {
  ACCEPT_HOURS,
  RETURN_RESPONSE_HOURS,
  SALES_CANCEL_LABEL,
  SALES_TABS,
  getSalesOrderStatus,
} from '../../constants/seller';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDateTime, formatPrice } from '../../utils/format';
import { addHours, formatMonthDayTime } from '../../utils/sellerFormat';
import { fetchSalesOrders } from './salesOrderLoader';
import SalesOrdersView from './SalesOrdersView';

// "몬스테라 델리시오사 외 1개"
function getItemName(order) {
  const name = order.representativeItemName ?? '상품';
  return order.itemCount > 1 ? `${name} 외 ${order.itemCount - 1}개` : name;
}

// 마감 시각: 응답에 있으면 그 값, 없으면 시작 시각 + 기한, 그것도 없으면 자리 문구
function deadlineText(deadline, startedAt, hours, placeholder) {
  if (deadline) return formatMonthDayTime(deadline);
  if (startedAt) return formatMonthDayTime(addHours(startedAt, hours));
  return placeholder;
}

// 판매 주문 응답 → 목록 한 줄
// TODO: 구매자 닉네임(buyerNickname) · 판매액(saleAmount, 배송비 제외) · 송장번호(trackingNo) ·
//       결제 완료 시각(paidAt) · 반품 신청 시각(returnRequestedAt) · 취소 주체(cancelledBy)가 목록 응답에 생기면 그대로 쓰임
function toSalesRow(order) {
  const statusKey = getSalesOrderStatus(order);
  const row = {
    sellerOrderId: order.sellerOrderId,
    createdAtText: formatDateTime(order.createdAt),
    orderNo: order.orderNo,
    buyer: order.buyerNickname ?? '{구매자 닉네임}',
    thumbnailUrl: order.thumbnailUrl,
    itemName: getItemName(order),
    amountText: formatPrice(Number(order.saleAmount ?? order.totalAmount)),
    statusKey,
    statusLabel: null,
    statusNote: null,
    action: 'DETAIL',
  };
  const tracking = order.trackingNo ?? '{송장번호}';

  switch (statusKey) {
    case 'ACCEPT_PENDING':
      row.statusNote = `${deadlineText(order.acceptDeadlineAt, order.paidAt, ACCEPT_HOURS, '{수락 마감}')}까지 수락하지 않으면 자동으로 거절돼요`;
      row.action = 'ACCEPT';
      break;
    case 'PICKUP':
    case 'SHIPPING':
    case 'DELIVERED':
      row.statusNote = `송장번호 ${tracking}`;
      break;
    case 'RETURN_REQUESTED':
      row.statusNote = `${deadlineText(order.returnDeadlineAt, order.returnRequestedAt, RETURN_RESPONSE_HOURS, '{응답 마감}')}까지 응답하지 않으면 자동으로 승인돼요`;
      row.action = 'RETURN';
      break;
    case 'CANCELLED':
      row.statusLabel = SALES_CANCEL_LABEL[order.cancelledBy] ?? '{취소 주체}';
      row.statusNote = '결제 금액이 구매자에게 환불됐어요';
      break;
    default:
      break;
  }
  return row;
}

function SalesOrdersPage() {
  usePageTitle('판매 주문');
  const { user, isLoggedIn, isInitializing } = useAuth();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [orders, setOrders] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error
  const [tab, setTab] = useState('');

  useEffect(() => {
    if (!canSell) return undefined;

    let ignore = false;
    // TODO: 백엔드에 상태 조회 조건 · 탭별 개수가 생기면 페이지 단위 조회로 교체
    fetchSalesOrders()
      .then((list) => {
        if (ignore) return;
        setOrders(list.map(toSalesRow));
        setLoadState('done');
      })
      .catch(() => {
        if (!ignore) setLoadState('error');
      });

    return () => {
      ignore = true;
    };
  }, [canSell]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/orders/seller' }} />;
  if (!canSell) return <Navigate to="/seller/register" replace />;
  if (loadState === 'loading') return <main className="flex-1" />;
  if (loadState === 'error') return <ErrorPage type="SERVER_ERROR" />;

  const tabs = SALES_TABS.map((item) => ({
    ...item,
    count: item.value ? orders.filter((row) => row.statusKey === item.value).length : orders.length,
  }));
  const rows = tab ? orders.filter((row) => row.statusKey === tab) : orders;

  return <SalesOrdersView tabs={tabs} tab={tab} onTabChange={setTab} rows={rows} />;
}

export default SalesOrdersPage;
