import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { cancelOrder, cancelOrderItem, confirmOrderItem, getOrder, withSellerNicknames, getBuyerShipmentTracking, withShipmentTracking } from '../../api/orderApi';
import ErrorPage from '../../components/common/ErrorPage';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import usePollWhile from '../../hooks/usePollWhile';
import useWallet from '../../hooks/useWallet';
import OrderDetailView from './orderDetail/OrderDetailView';
import { CancelAllModal, CancelModal, ConfirmModal, TrackingModal } from './orderDetail/OrderDetailModals';
import {
  buildCancelAllTarget,
  buildCancelTarget,
  buildConfirmTarget,
  buildOrderDetailView,
  isCancelInProgress,
} from './orderDetail/orderDetailModel';
import { EMPTY, NO_LOCATION } from '../../constants/emptyText';

const CANCEL_POLL_INTERVAL_MS = 2500; // 취소 처리 중이면 2.5초마다 다시 조회
const CANCEL_POLL_TIMEOUT_MS = 2 * 60 * 1000; // 2분이 지나도 안 끝나면 멈추고 지금 화면 그대로

const REFRESH_COOLDOWN_SECONDS = 10; // 기사님 거리 · 배송 조회 새로고침은 10초에 한 번

// 기사님이 수거지 2km 안이라 취소 불가 (BE OrderErrorCode SHIPMENT_NOT_CANCELABLE, 409)
const NOT_CANCELABLE_CODES = ['SHIPMENT_NOT_CANCELABLE'];

// 주문 API는 ApiResponse로 감싸지 않고 DTO를 그대로 반환
// 판매자 닉네임은 주문 응답에 없어 판매자 공개 API로 채움 (실패해도 주문은 보임)
async function fetchOrder(orderId) {
  const response = await getOrder(orderId);
  const order = await withSellerNicknames(response.data.data ?? response.data);
  // 배송 조회(#605): 택배 예약 뒤 배송 중인 판매자 주문만 기사님 거리 · 현재 위치를 붙임 (실패하면 그대로)
  const sellerOrders = await Promise.all(
    (order.sellerOrders ?? []).map((sellerOrder) =>
      withShipmentTracking(sellerOrder, () => getBuyerShipmentTracking(orderId, sellerOrder.id)),
    ),
  );
  return { ...order, sellerOrders };
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
  const [cancelAllTarget, setCancelAllTarget] = useState(null);
  const [cancellingAll, setCancellingAll] = useState(false);
  const [cancelAllError, setCancelAllError] = useState(null);
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

  // 취소는 BE에서 비동기로 끝남: 처리 중(CANCEL_PROCESSING · CANCEL_PENDING)이면 끝날 때까지 다시 조회하고,
  // 끝나면 환불된 예치금을 헤더 잔액에 반영
  usePollWhile(isCancelInProgress(order), reload, {
    interval: CANCEL_POLL_INTERVAL_MS,
    timeout: CANCEL_POLL_TIMEOUT_MS,
    onDone: () => refreshWallet().catch(() => {}),
  });

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
  const closeCancelAll = useCallback(() => {
    setCancelAllTarget(null);
    setCancelAllError(null);
  }, []);
  // 주문 전체 취소가 가능한 상태면 모달 내용, 아니면 null (버튼도 숨김)
  const cancelAllPreview = useMemo(
    () => (order ? buildCancelAllTarget(order, lockedSellerOrderIds) : null),
    [order, lockedSellerOrderIds],
  );

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

  // 주문 전체 취소 (시안 03-5-3): 성공하면 예치금 갱신 + 다시 불러옴. 실패는 모달 안 오류, 409면 상태도 다시 불러옴
  const runCancelAll = async () => {
    setCancellingAll(true);
    setCancelAllError(null);
    try {
      await cancelOrder(orderId);
      refreshWallet().catch(() => {});
      closeCancelAll();
      await reload();
    } catch (error) {
      setCancelAllError(error.response?.data?.message ?? '주문을 취소하지 못했어요. 잠시 후 다시 시도해 주세요.');
      if (error.response?.status === 409) reload().catch(() => {});
    } finally {
      setCancellingAll(false);
    }
  };

  // 배송 조회 모달: 배송 단계 시각 목록(buildShipmentEvents) + 최신 줄에 현재 위치(배송 조회 API locationName). 시각이 하나도 없으면 「조회 전」 한 줄
  const tracking = trackingGroup && {
    sellerName: trackingGroup.sellerName,
    invoiceLabel: trackingGroup.invoiceLabel,
    invoiceNo: trackingGroup.tracking?.invoiceNo ?? trackingGroup.invoiceNo,
    events: trackingGroup.shipmentEvents?.length
      ? trackingGroup.shipmentEvents
      : [{ time: EMPTY, status: NO_LOCATION }],
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
      onCancelAll={cancelAllPreview ? () => setCancelAllTarget(cancelAllPreview) : null}
    >
      {cancelAllTarget && (
        <CancelAllModal
          target={cancelAllTarget}
          cancelling={cancellingAll}
          error={cancelAllError}
          onClose={closeCancelAll}
          onConfirm={runCancelAll}
        />
      )}
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
