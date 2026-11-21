import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import ErrorPage from '../../components/common/ErrorPage';
import {
  ACCEPT_HOURS,
  RETURN_RESPONSE_HOURS,
  SALES_CANCEL_LABEL,
  SALES_TABS,
  getSalesListStatus,
  getSalesTab,
} from '../../constants/seller';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDateTime, formatPrice } from '../../utils/format';
import { addHours, formatMonthDayTime } from '../../utils/sellerFormat';
import { attachTrackingNos, fetchSalesOrders } from './salesOrderLoader';
import SalesOrdersView from './SalesOrdersView';
import { NO_TRACKING_NO, CANCELLED_LABEL } from '../../constants/emptyText';

// "몬스테라 델리시오사 외 1개"
function getItemName(order) {
  const name = order.representativeItemName ?? '상품';
  return order.itemCount > 1 ? `${name} 외 ${order.itemCount - 1}개` : name;
}

// 마감 시각: 응답에 있으면 그 값, 없으면 시작 시각 + 기한, 그것도 없으면 null (문장에서 시각을 뺌)
function deadlineText(deadline, startedAt, hours) {
  if (deadline) return formatMonthDayTime(deadline);
  if (startedAt) return formatMonthDayTime(addHours(startedAt, hours));
  return null;
}

// "10월 17일 14:20까지 " · 시각이 없으면 ''
const untilText = (text) => (text ? `${text}까지 ` : '');

// 판매 주문 응답 → 목록 한 줄
// 송장번호(trackingNo)는 목록 응답에 없어 판매 주문 상세로 채움(attachTrackingNos)
// 구매자 열은 목록에서 뺌(11/20 사용자 결정). TODO: 판매액(saleAmount, 배송비 제외) ·
//       결제 완료 시각(paidAt) · 반품 신청 시각(returnRequestedAt) · 취소 주체(cancelledBy)가 목록 응답에 생기면 그대로 쓰임
function toSalesRow(order) {
  const { key: statusKey, partialReturnCount } = getSalesListStatus(order);
  const row = {
    sellerOrderId: order.sellerOrderId,
    createdAtText: formatDateTime(order.createdAt),
    orderNo: order.orderNo,
    thumbnailUrl: order.thumbnailUrl,
    itemName: getItemName(order),
    amountText: formatPrice(Number(order.saleAmount ?? order.totalAmount)),
    statusKey,
    tabKey: getSalesTab(statusKey),
    statusLabel: null,
    statusTag: partialReturnCount > 0 ? `일부 반품 ${partialReturnCount}건` : null, // 일부만 반품: 배송 배지 + 안내 앞 굵은 글씨
    statusNote: null,
    action: 'DETAIL',
  };
  const tracking = order.trackingNo ?? NO_TRACKING_NO;

  switch (statusKey) {
    case 'ACCEPT_PENDING':
      row.statusNote = `${untilText(deadlineText(order.acceptDeadline ?? order.acceptDeadlineAt, order.paidAt, ACCEPT_HOURS))}수락하지 않으면 자동으로 거절돼요`;
      row.action = 'ACCEPT';
      break;
    case 'PICKUP':
    case 'SHIPPING':
    case 'DELIVERED':
      row.statusNote = `송장번호 ${tracking}`;
      break;
    case 'RETURN_REQUESTED':
      row.statusNote = `${untilText(deadlineText(order.returnDeadlineAt, order.returnRequestedAt, RETURN_RESPONSE_HOURS))}응답하지 않으면 자동으로 승인돼요`;
      row.action = 'RETURN';
      break;
    case 'RETURN_SHIPPING':
      row.statusNote = '반품 상품이 돌아오고 있어요';
      break;
    case 'RETURNED':
      row.statusNote = '반품이 끝나 구매자에게 환불됐어요';
      break;
    case 'CANCELLED':
      row.statusLabel = SALES_CANCEL_LABEL[order.cancelledBy] ?? CANCELLED_LABEL;
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
        // 송장번호 · 반품 단계는 판매 주문 상세로 채운 뒤 다시 그림 (실패해도 목록은 그대로)
        attachTrackingNos(list).then((enriched) => {
          if (!ignore) setOrders(enriched.map(toSalesRow));
        });
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
    count: item.value ? orders.filter((row) => row.tabKey === item.value).length : orders.length,
  }));
  const rows = tab ? orders.filter((row) => row.tabKey === tab) : orders;

  return <SalesOrdersView tabs={tabs} tab={tab} onTabChange={setTab} rows={rows} />;
}

export default SalesOrdersPage;
