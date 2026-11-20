import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { cancelOrderItem, confirmOrderItem, getOrder } from '../../api/orderApi';
import ErrorPage from '../../components/common/ErrorPage';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import OrderDetailView from './orderDetail/OrderDetailView';
import { CancelModal, ConfirmModal, TrackingModal } from './orderDetail/OrderDetailModals';
import { buildCancelTarget, buildConfirmTarget, buildOrderDetailView } from './orderDetail/orderDetailModel';

const REFRESH_COOLDOWN_SECONDS = 10; // 기사님 거리 · 배송 조회 새로고침은 10초에 한 번

// 기사님이 수거지 2km 안이라 취소 불가 (BE OrderErrorCode SHIPMENT_NOT_CANCELABLE, 409)
const NOT_CANCELABLE_CODES = ['SHIPMENT_NOT_CANCELABLE'];

// 주문 API는 ApiResponse로 감싸지 않고 DTO를 그대로 반환
async function fetchOrder(orderId) {
  const response = await getOrder(orderId);
  return response.data.data ?? response.data;
}

function OrderDetailPage() {
  usePageTitle('주문 상세');
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, isInitializing } = useAuth();
  const { refreshWallet } = useWallet();

  const [order, setOrder] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error | notFound
  const [busyItemId, setBusyItemId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  // 취소 409 뒤 다시 불러온 상태를 화면에 반영하기 위한 표시 (모달 없이)
  const [duplicateCancelIds, setDuplicateCancelIds] = useState(() => new Set());
  const [lockedSellerOrderIds, setLockedSellerOrderIds] = useState(() => new Set());
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [trackingGroup, setTrackingGroup] = useState(null);
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  const reload = useCallback(async () => {
    const data = await fetchOrder(orderId);
    setOrder(data);
    return data;
  }, [orderId]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    fetchOrder(orderId)
      .then((data) => {
        if (ignore) return;
        setOrder(data);
        setLoadState('done');
      })
      .catch((error) => {
        if (!ignore) setLoadState(error.response?.status === 404 ? 'notFound' : 'error');
      });
    return () => {
      ignore = true;
    };
  }, [isLoggedIn, orderId]);

  // 새로고침 대기 초 줄이기
  useEffect(() => {
    if (refreshCooldown <= 0) return undefined;
    const timer = setTimeout(() => setRefreshCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [refreshCooldown]);

  const view = useMemo(
    () =>
      order && buildOrderDetailView(order, { duplicateCancelIds, lockedSellerOrderIds }),
    [order, duplicateCancelIds, lockedSellerOrderIds],
  );

  const closeCancel = useCallback(() => {
    setCancelTarget(null);
    setCancelError(null);
  }, []);
  const closeConfirm = useCallback(() => {
    setConfirmTarget(null);
    setConfirmError(null);
  }, []);
  const closeTracking = useCallback(() => setTrackingGroup(null), []);

  if (isInitializing) return <main className="flex-1" />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: `/orders/${orderId}` }} />;
  if (loadState === 'loading') return <main className="flex-1" />;
  if (loadState === 'notFound') return <ErrorPage type="NOT_FOUND" />;
  if (loadState === 'error') return <ErrorPage type="SERVER_ERROR" />;

  const refreshDistance = () => {
    setRefreshCooldown(REFRESH_COOLDOWN_SECONDS);
    reload().catch(() => {});
  };

  // 모달의 「구매 확정」을 눌렀을 때만 확정. 실패하면 모달 안에 오류를 보여 줌
  const runConfirm = async () => {
    const { itemId } = confirmTarget;
    setConfirming(true);
    setConfirmError(null);
    setBusyItemId(itemId);
    try {
      await confirmOrderItem(itemId);
      closeConfirm();
      await reload();
    } catch (error) {
      setConfirmError(error.response?.data?.message ?? '구매를 확정하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setConfirming(false);
      setBusyItemId(null);
    }
  };

  const handleAction = (type, item) => {
    if (type === 'return') navigate(`/orders/${orderId}/items/${item.id}/return`);
    if (type === 'confirm') setConfirmTarget(buildConfirmTarget(order, item.id));
    if (type === 'cancel') setCancelTarget(buildCancelTarget(order, item.id));
  };

  const runCancel = async () => {
    const { itemId } = cancelTarget;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelOrderItem(itemId);
      // 취소하면 결제 금액이 예치금으로 돌아오므로 헤더 잔액도 갱신
      refreshWallet().catch(() => {});
      closeCancel();
      await reload();
    } catch (error) {
      if (error.response?.status === 409) {
        // 409(기사님 근접 · 이미 취소 요청)는 모달 없이 상세를 다시 불러와 상태를 바꿈
        closeCancel();
        const code = error.response?.data?.code;
        const fresh = await reload().catch(() => null);
        const sellerOrder = fresh?.sellerOrders?.find((so) => so.items.some((it) => it.id === itemId));
        const freshItem = sellerOrder?.items.find((it) => it.id === itemId);
        if (sellerOrder?.shipmentStatus === 'CANCEL_PENDING' || freshItem?.status === 'CANCEL_PROCESSING') {
          setDuplicateCancelIds((ids) => new Set(ids).add(itemId));
        } else if (sellerOrder && NOT_CANCELABLE_CODES.includes(code)) {
          setLockedSellerOrderIds((ids) => new Set(ids).add(sellerOrder.id));
        }
      } else {
        setCancelError(error.response?.data?.message ?? '상품을 취소하지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setCancelling(false);
    }
  };

  // TODO: 배송 조회 API(getShipmentTracking)가 생기면 이벤트 목록을 받아 씀. 지금은 자리 문구
  const tracking = trackingGroup && {
    sellerName: trackingGroup.sellerName,
    invoiceNo: trackingGroup.tracking?.invoiceNo ?? trackingGroup.invoiceNo,
    events: [{ time: '{시각}', status: '{배송 단계}', location: '{위치}' }],
  };

  const copyInvoice = () => {
    navigator.clipboard?.writeText(tracking.invoiceNo).catch(() => {});
  };

  return (
    <OrderDetailView
      view={view}
      busyItemId={busyItemId}
      refreshCooldown={refreshCooldown}
      onAction={handleAction}
      onOpenTracking={setTrackingGroup}
      onRefreshDistance={refreshDistance}
    >
      {cancelTarget && (
        <CancelModal
          target={cancelTarget}
          cancelling={cancelling}
          error={cancelError}
          onClose={closeCancel}
          onConfirm={runCancel}
        />
      )}
      {confirmTarget && (
        <ConfirmModal
          target={confirmTarget}
          confirming={confirming}
          error={confirmError}
          onClose={closeConfirm}
          onConfirm={runConfirm}
        />
      )}
      {tracking && (
        <TrackingModal
          tracking={tracking}
          refreshCooldown={refreshCooldown}
          onRefresh={refreshDistance}
          onCopy={copyInvoice}
          onClose={closeTracking}
        />
      )}
    </OrderDetailView>
  );
}

export default OrderDetailPage;
