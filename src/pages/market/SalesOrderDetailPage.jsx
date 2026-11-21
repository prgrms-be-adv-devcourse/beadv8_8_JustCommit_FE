import { useCallback, useEffect, useState } from 'react';
import {
  RETURN_ITEM_STATUSES,
  buildReturnDistance,
  buildReturnLocation,
  buildReturnShipmentEvents,
  buildReturnTimeline,
  isReturnShipping,
} from '../../components/order/returnSteps';
import { Navigate, useParams } from 'react-router-dom';
import { getAddresses } from '../../api/memberApi';
import { approveReturn, rejectReturn, respondSellerOrder } from '../../api/orderApi';
import ErrorPage from '../../components/common/ErrorPage';
import { RETURN_REASON_LABEL, SHIPPING_FEE_PER_SELLER } from '../../constants/order';
import {
  ACCEPT_HOURS,
  RETURN_RESPONSE_HOURS,
  SALES_CANCEL_LABEL,
  SETTLEMENT_FEE_RATE,
  getSalesOrderStatus,
  getSalesShipmentStep,
} from '../../constants/seller';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import usePollWhile from '../../hooks/usePollWhile';
import { formatDate, formatDateTime, formatPrice, maskPhone } from '../../utils/format';
import { addHours, formatMonthDayTime, formatShortDateTime } from '../../utils/sellerFormat';
import { fetchSalesOrder } from './salesOrderLoader';
import {
  getSellerShipmentTracking,
  withShipmentTracking,
  getSellerReturnShipmentTracking,
  withReturnShipmentTracking,
} from '../../api/orderApi';
import SalesOrderDetailView from './SalesOrderDetailView';
import { TrackingModal } from './orderDetail/OrderDetailModals';
import { buildShipmentEvents } from './orderDetail/orderDetailModel';
import { EMPTY, NO_TRACKING_NO, NO_LOCATION, CANCELLED_LABEL, orEmpty } from '../../constants/emptyText';

const SHIPPING_FEE_NOTE = '배송비는 플랫폼 매출로 들어가 정산에 포함되지 않아요';
const GRAY_BADGE = 'bg-[#f3f4f6] border-[#f3f4f6] text-[#6b7280]';

const itemIdOf = (item) => item.orderItemId ?? item.id;

const CANCEL_POLL_INTERVAL_MS = 2500; // 취소 처리 중이면 2.5초마다 다시 조회
const CANCEL_POLL_TIMEOUT_MS = 2 * 60 * 1000; // 2분이 지나도 안 끝나면 멈추고 지금 화면 그대로

// 취소(거절 포함)가 아직 끝나지 않은 판매 주문 (BE ADR 0026)
const isSalesCancelInProgress = (order) =>
  order?.shipmentStatus === 'CANCEL_PENDING' || (order?.items ?? []).some((item) => item.status === 'CANCEL_PROCESSING');

// 응답 필드 이름이 isDefault / default 중 어느 쪽이어도 동작하도록
const isDefaultAddress = (address) => address.isDefault ?? address.default ?? false;

// 보내는 주소 한 줄: 「김개식 · 집 · (04700) 서울특별시 … , 302호」 (시안 08-5-2)
function toSenderOption(address) {
  const line = `(${address.zipcode}) ${[address.address1, address.address2].filter(Boolean).join(', ')}`;
  return {
    addressId: address.addressId,
    isDefault: isDefaultAddress(address),
    text: [address.recipientName, address.addressName, line].filter(Boolean).join(' · '),
  };
}

// 마감 시각: 응답에 있으면 그 값, 없으면 시작 시각 + 기한, 그것도 없으면 null (화면 문장에서 시각을 뺌)
function deadlineText(deadline, startedAt, hours) {
  if (deadline) return formatMonthDayTime(deadline);
  if (startedAt) return formatMonthDayTime(addHours(startedAt, hours));
  return null;
}

// 수락 · 거절 대상: 수락 대기(ACCEPT_PENDING) 상품만. 상태 값이 없으면(옛 응답) 모두 대상으로 봄
const isAcceptPending = (item) => !item.status || item.status === 'ACCEPT_PENDING';

// 수락 대기: 체크한 상품 수에 따라 안내 · 버튼 문구
function acceptTexts(allItems, rejectIds) {
  const items = allItems.filter(isAcceptPending);
  const total = items.length;
  const rejected = items.filter((item) => rejectIds.includes(itemIdOf(item)));
  const n = rejected.length;
  if (n === 0) {
    return {
      summary: `체크한 상품이 없어요. ${total}개 모두 수락되고 택배 예약이 진행돼요.`,
      submitLabel: `${total}개 수락`,
    };
  }
  if (n === total) {
    return {
      summary: `${total}개 모두 거절되고 배송비를 포함한 결제 금액이 구매자에게 환불돼요.`,
      submitLabel: `${total}개 거절`,
    };
  }
  const amount = rejected.reduce((sum, item) => sum + Number(item.price), 0);
  return {
    summary: `체크한 ${n}개 상품(${formatPrice(amount)})만 거절되고 구매자에게 환불돼요. 나머지 ${total - n}개는 수락되고 택배 예약이 진행돼요.`,
    submitLabel: `${n}개 거절 · ${total - n}개 수락`,
  };
}

// 판매 주문 상세 응답 → 화면 값
// 반품 사유 · 설명 · 신청 시각 · 응답 마감은 items[]의 returnReason · returnDetail · returnRequestedAt · returnDeadlineAt (#593)
// 구매자 닉네임은 최상위 buyerNickname (#604, 배포 전. 탈퇴 회원이면 「탈퇴한 회원」, 모르면 「알 수 없는 회원」)
// TODO: 취소 주체(cancelledBy) · 반송 중 여부(returnShipping) · 현재 위치(currentLocation) · 배송 조회 주소(trackingUrl) ·
//       결제 완료 시각(paidAt) · 판매자 부담금(sellerBurden)이 응답에 생기면 그대로 쓰임. 없으면 기본값(emptyText)
// 반품 중인 주문상품(BE RETURN_*)이 있으면 반품 타임라인 데이터 (components/order/returnSteps)
function returnTimelineOf(items, deliveredAt) {
  const returnItem = items.find((item) => RETURN_ITEM_STATUSES.includes(item.status));
  if (!returnItem) return null;
  // 반품 택배 단계(승인 뒤)면 반품 송장 · 배송 조회를 반품 택배 기준으로 (BE #606 returnTrackingNo · returnShipmentStatus)
  const returnShipping = isReturnShipping(returnItem);
  return {
    deliveredTime: deliveredAt ? formatShortDateTime(deliveredAt) : null,
    steps: buildReturnTimeline(returnItem),
    tracking: returnShipping
      ? {
          invoiceNo: returnItem.returnTrackingNo ?? NO_TRACKING_NO,
          location: buildReturnLocation(returnItem),
          distance: buildReturnDistance(returnItem),
        }
      : null,
    events: returnShipping ? buildReturnShipmentEvents(returnItem) : null,
  };
}

function toViewOrder(order) {
  const salesStatus = getSalesOrderStatus(order);
  const items = order.items ?? [];
  const cancelLabel = SALES_CANCEL_LABEL[order.cancelledBy] ?? CANCELLED_LABEL;

  let mode = 'NORMAL';
  if (salesStatus === 'ACCEPT_PENDING') mode = 'ACCEPT';
  else if (salesStatus === 'RETURN_REQUESTED') mode = 'RETURN_REQUESTED';
  else if (salesStatus === 'CANCELLED' && order.returnShipping) mode = 'CANCEL_RETURN';

  const viewItems = items.map((item) => {
    let statusText = null;
    let statusTone = 'text-[#6b7280]';
    if (item.status === 'CANCELLED') statusText = SALES_CANCEL_LABEL[item.cancelledBy ?? order.cancelledBy] ?? cancelLabel;
    if (item.status === 'RETURN_REQUESTED') {
      statusText = '반품 신청';
      statusTone = 'text-[#92400e]';
    }
    // 시안 04-5-4: 반품 택배가 오는 중 · 판매자에게 도착(환불 대기)
    if (item.status === 'RETURN_IN_TRANSIT' || item.status === 'RETURN_PROCESSING') {
      statusText = item.status === 'RETURN_IN_TRANSIT' ? '반품 배송 중' : '판매자 도착';
      statusTone = 'text-[#92400e]';
    }
    if (item.status === 'RETURNED') statusText = '반품 완료';
    if (salesStatus === 'UNPAID') statusText = '결제 미완료';
    return {
      orderItemId: itemIdOf(item),
      name: item.productName,
      thumbnailUrl: item.thumbnailUrl,
      priceText: formatPrice(Number(item.price)),
      statusText,
      statusTone,
    };
  });

  const shippingFee = Number(order.shippingFee ?? SHIPPING_FEE_PER_SELLER);
  // 결제 미완료 주문은 판매액 0원 (시안 08-5-8)
  const liveItems = salesStatus === 'UNPAID' ? [] : items.filter((item) => item.status !== 'CANCELLED');
  const sale = liveItems.reduce((sum, item) => sum + Number(item.price), 0);
  const fee = Math.floor(sale * SETTLEMENT_FEE_RATE);
  const burden = Number(order.sellerBurden ?? 0);

  let settlement;
  if (salesStatus === 'UNPAID') {
    // 시안 08-5-8: 결제가 끝나지 않은 주문 (목록에서는 빠지지만 주소로 직접 들어온 경우)
    settlement = {
      badgeText: '결제 미완료',
      badgeTone: GRAY_BADGE,
      amounts: null,
      note: '결제가 완료되지 않은 주문이에요. 정산하지 않아요.',
    };
  } else if (salesStatus === 'CANCELLED') {
    settlement = {
      badgeText: cancelLabel,
      badgeTone: GRAY_BADGE,
      amounts: null,
      // 취소 주체를 모르면(응답에 cancelledBy 없음) 「취소된 주문」으로 (시안 08-5-7)
      note:
        order.cancelledBy === 'BUYER'
          ? '구매자가 취소한 주문이라 정산하지 않아요.'
          : order.cancelledBy
            ? '거절한 주문이라 정산하지 않아요.'
            : '취소된 주문이라 정산하지 않아요.',
    };
  } else {
    const settled = order.settlementStatus === 'COMPLETED';
    const pending = order.settlementStatus === 'PENDING' || order.settlementStatus === 'FAILED';
    let note = `구매 확정 후 정산돼요 · ${SHIPPING_FEE_NOTE}`;
    if (mode === 'ACCEPT') note = `수락하면 배송이 시작되고, 구매 확정 후 정산돼요 · ${SHIPPING_FEE_NOTE}`;
    if (mode === 'RETURN_REQUESTED') note = `반품 처리가 끝난 뒤 정산돼요 · ${SHIPPING_FEE_NOTE}`;
    if (pending) note = `곧 예치금으로 들어가요 · ${SHIPPING_FEE_NOTE}`;
    if (settled) note = `${order.settledAt ? `${formatDate(order.settledAt)}에 ` : ''}정산됐어요 · ${SHIPPING_FEE_NOTE}`;
    let badgeText = '정산 전';
    if (pending) badgeText = '지급 대기';
    if (settled) badgeText = '지급 완료';
    settlement = {
      badgeText,
      badgeTone: GRAY_BADGE,
      amounts: {
        saleText: formatPrice(sale),
        feeText: `− ${formatPrice(fee)}`,
        burdenText: burden > 0 ? `− ${formatPrice(burden)}` : null,
        payoutLabel: settled || pending ? '정산 금액' : '정산 예정 금액',
        payoutText: formatPrice(sale - fee - burden),
      },
      note,
    };
  }

  const step = getSalesShipmentStep(order, salesStatus);
  const booked = order.shipmentStatus === 'BOOKED' || order.shipmentStatus === 'CANCEL_LOCKED';
  // 시안 08-5-7: 상품이 모두 취소된 주문(반송 중이 아님)은 송장 · 배송 단계 · 배송 조회 대신 안내 한 줄
  const cancelledOnly = salesStatus === 'CANCELLED' && mode === 'NORMAL';
  // 반품 승인 뒤(반품 배송 중 · 환불 중 · 완료)에는 반품 송장(items[].returnTrackingNo, #606). 판매 송장 order.trackingNo와 다름
  const returnShipItem = items.find((item) =>
    ['RETURN_IN_TRANSIT', 'RETURN_PROCESSING', 'RETURNED'].includes(item.status),
  );
  const trackingNo = returnShipItem ? returnShipItem.returnTrackingNo : order.trackingNo;

  // 판매액 줄 배송비 문구 (BE cancel-refund.md 「반품 환불」): 반품 배송비는 판매자가 냄.
  // 전부 반품(취소 상품을 빼고 남은 상품이 모두 반품 승인 뒤)이면 구매자가 낸 원래 배송비도 판매자가 냄
  const feeText = formatPrice(shippingFee);
  const notCancelledItems = items.filter((item) => item.status !== 'CANCELLED');
  const allReturned =
    notCancelledItems.length > 0 &&
    notCancelledItems.every((item) => ['RETURN_IN_TRANSIT', 'RETURN_PROCESSING', 'RETURNED'].includes(item.status));
  let saleFeeText = `배송비 ${feeText}은 구매자가 내요`;
  if (allReturned) saleFeeText = `구매자가 낸 배송비 ${feeText}과 반품 배송비 ${feeText}은 판매자가 내요`;
  else if (returnShipItem) saleFeeText = `배송비 ${feeText}은 구매자가 내요 · 반품 배송비 ${feeText}은 판매자가 내요`;

  const shipment =
    mode === 'ACCEPT'
      ? null
      : salesStatus === 'UNPAID'
        ? { cancelledNote: '결제가 완료되지 않은 주문이에요. 배송하지 않아요.' }
        : cancelledOnly
        ? { cancelledNote: '취소된 주문이라 배송하지 않아요.' }
        : {
          trackingNo: trackingNo ?? NO_TRACKING_NO,
          // 시안 08-5-5: 택배 예약이 끝난 픽업 대기(BOOKED · CANCEL_LOCKED)는 예약 완료 안내
          note:
            step === 0 && mode === 'NORMAL'
              ? booked
                ? '택배 예약이 끝났어요. 상품을 포장해 두면 기사님이 가지러 가요.'
                : // 시안 08-5-6: 수락은 끝났고 택배 예약(송장)을 기다리는 중 (배송 READY)
                  '택배 예약을 기다리고 있어요. 예약되면 송장번호가 나와요. 상품을 미리 포장해 두세요.'
              : null,
          step: mode === 'CANCEL_RETURN' ? null : step,
          // 시안 04-5-1: 반품 중인 상품이 있으면 배송 단계 대신 구매자 상세와 같은 반품 타임라인
          returnTimeline: returnTimelineOf(items, order.deliveredAt),
          // 시안: 배송 완료 시각만 단계 아래에 보여 줌
          stepTimes: [null, null, null, order.deliveredAt ? formatShortDateTime(order.deliveredAt) : null, null],
          // 현재 위치: BE에 없으면 칸을 숨김
          location: order.currentLocation ?? null,
          // 시안 08-5-5: 픽업 대기일 때 수거지까지 기사님 거리. TODO: BE 기사님 거리 API가 생기면 연결 (값이 없으면 박스 숨김)
          distance:
            step === 0 && booked && order.driverDistanceKm != null
              ? {
                  km: `${order.driverDistanceKm}km`,
                  checkedAt: order.driverCheckedAt ? formatShortDateTime(order.driverCheckedAt).slice(6) : null,
                }
              : null,
          events: buildShipmentEvents(order),
        };

  // 시안 04-5-4: 반품 택배 단계면 가는 배송 송장 · 현재 위치 · 기사님 거리 대신 반품 송장 · 반품 택배 단계만 보여 줌
  // (가는 배송은 타임라인 위 「구매 배송 · 배송 완료」 한 줄로만 남음)
  const returnTracking = shipment?.returnTimeline?.tracking;
  if (returnTracking) {
    shipment.headTrackingHidden = true;
    shipment.invoiceLabel = '반품 송장번호';
    shipment.trackingNo = returnTracking.invoiceNo;
    shipment.events = shipment.returnTimeline.events;
    shipment.location = null;
    shipment.distance = null;
  }

  return {
    sellerOrderId: order.sellerOrderId,
    mode,
    headerText: `주문 번호 ${orEmpty(order.orderNo)} · ${formatDateTime(order.createdAt)} · 구매자 ${order.buyerNickname ?? EMPTY}`,
    items: viewItems,
    saleFooter:
      mode === 'CANCEL_RETURN'
        ? null
        : { label: `판매액 (${saleFeeText})`, amountText: formatPrice(sale) },
    recipient: {
      name: order.recipientName,
      phone: maskPhone(order.recipientPhone),
      address: `(${orEmpty(order.zipcode)}) ${orEmpty(order.address1)}${order.address2 ? `, ${order.address2}` : ''}`,
    },
    shipment,
    settlement,
    returnItem: items.find((item) => item.status === 'RETURN_REQUESTED') ?? null,
    shippingFee,
  };
}

function SalesOrderDetailPage() {
  usePageTitle('판매 주문 상세');
  const { sellerOrderId } = useParams();
  const { user, isLoggedIn, isInitializing } = useAuth();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [order, setOrder] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error

  const [rejectIds, setRejectIds] = useState([]);
  const [senderOptions, setSenderOptions] = useState([]); // 판매자 배송지 (보내는 주소)
  const [senderId, setSenderId] = useState(null);
  const [modal, setModal] = useState(null); // 반품 'APPROVE' | 'REJECT'
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false); // 배송 조회 모달 (시안 03-5-4와 같은 모달)
  const [refreshCooldown, setRefreshCooldown] = useState(0); // 새로고침은 10초에 한 번

  useEffect(() => {
    if (refreshCooldown <= 0) return undefined;
    const timerId = setTimeout(() => setRefreshCooldown((sec) => sec - 1), 1000);
    return () => clearTimeout(timerId);
  }, [refreshCooldown]);

  const load = useCallback(
    () =>
      fetchSalesOrder(sellerOrderId)
        // 배송 조회(#605): 택배 예약 뒤 배송 중이면 기사님 거리 · 현재 위치를 붙임 (실패하면 그대로)
        .then((data) => withShipmentTracking(data, () => getSellerShipmentTracking(sellerOrderId)))
        // 반품 택배 조회(#621): 반품 택배가 예약 뒤 · 도착 전인 상품만 기사님 거리 · 현재 위치를 붙임 (실패하면 그대로)
        .then(async (data) => ({
          ...data,
          items: await Promise.all(
            (data.items ?? []).map((item) =>
              withReturnShipmentTracking(item, () => getSellerReturnShipmentTracking(sellerOrderId, item.id)),
            ),
          ),
        }))
        .then((data) => {
          setOrder(data);
          setLoadState('done');
        }),
    [sellerOrderId],
  );

  useEffect(() => {
    if (!canSell) return undefined;
    let ignore = false;
    load().catch(() => {
      if (!ignore) setLoadState('error');
    });
    return () => {
      ignore = true;
    };
  }, [canSell, load]);

  // 거절 · 구매자 취소는 BE에서 비동기로 끝남: 처리 중(CANCEL_PROCESSING · CANCEL_PENDING)이면 끝날 때까지 다시 조회
  usePollWhile(isSalesCancelInProgress(order), load, {
    interval: CANCEL_POLL_INTERVAL_MS,
    timeout: CANCEL_POLL_TIMEOUT_MS,
  });

  // 보내는 주소 후보 = 내 배송지 (GET /api/v1/users/me/addresses, 최대 4개). 처음엔 기본 배송지
  useEffect(() => {
    if (!canSell) return undefined;
    let ignore = false;
    getAddresses()
      .then((response) => {
        if (ignore) return;
        const list = response.data.data ?? [];
        setSenderOptions(list.map(toSenderOption));
        setSenderId((list.find(isDefaultAddress) ?? list[0])?.addressId ?? null);
      })
      .catch(() => {
        // 못 불러오면 「등록된 배송지가 없어요」로 보이고 수락 버튼이 막힘
      });
    return () => {
      ignore = true;
    };
  }, [canSell]);

  const closeModal = useCallback(() => {
    if (!isSubmitting) setModal(null);
  }, [isSubmitting]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: `/orders/seller/${sellerOrderId}` }} />;
  if (!canSell) return <Navigate to="/seller/register" replace />;
  if (loadState === 'loading') return <main className="flex-1" />;
  if (loadState === 'error') return <ErrorPage type="NOT_FOUND" />;

  const view = toViewOrder(order);

  // 버튼 동작 공통: 요청 → 성공하면 다시 불러오기, 실패하면 안내
  const run = async (request, fallback, onDone) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await request();
      onDone?.();
      await load();
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? fallback);
      // 이미 처리됨(자동 거절 · 구매자 취소 등): 지금 상태를 다시 불러와 보여 줌 (BE 409 SELLER_ORDER_NOT_ACCEPTABLE)
      // 반품도 이미 처리됨(자동 승인 · 다른 창에서 응답)이면 다시 불러옴 (BE 409 RETURN_NOT_DECIDABLE)
      if (error.response?.data?.code === 'RETURN_NOT_DECIDABLE') {
        setModal(null);
        load().catch(() => {});
      }
      if (error.response?.data?.code === 'SELLER_ORDER_NOT_ACCEPTABLE') {
        setRejectIds([]);
        load().catch(() => {});
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingIds = (order.items ?? []).filter(isAcceptPending).map(itemIdOf);
  const { summary, submitLabel } = acceptTexts(order.items ?? [], rejectIds);
  const accept = {
    deadlineText: deadlineText(order.acceptDeadline ?? order.acceptDeadlineAt, order.paidAt, ACCEPT_HOURS),
    rejectIds,
    sender: { options: senderOptions, selectedId: senderId, onChange: setSenderId },
    onToggle: (id) => {
      if (!pendingIds.includes(id)) return; // 수락 대기가 아닌 상품은 체크할 수 없음
      setRejectIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    },
    summary,
    submitLabel,
    isSubmitting,
    errorMessage: view.mode === 'ACCEPT' ? errorMessage : '',
    onSubmit: () =>
      run(() => respondSellerOrder(sellerOrderId, rejectIds, senderId), '주문에 응답하지 못했어요. 잠시 후 다시 시도해 주세요.', () =>
        setRejectIds([]),
      ),
  };

  const { returnItem } = view;
  const returnRequest = returnItem && {
    deadlineText: deadlineText(returnItem.returnDeadlineAt, returnItem.returnRequestedAt, RETURN_RESPONSE_HOURS),
    requestedAtText: returnItem.returnRequestedAt ? formatShortDateTime(returnItem.returnRequestedAt) : null,
    item: {
      name: returnItem.productName,
      shortName: returnItem.productName,
      thumbnailUrl: returnItem.thumbnailUrl,
      priceText: formatPrice(Number(returnItem.price)),
    },
    reason: RETURN_REASON_LABEL[returnItem.returnReason] ?? returnItem.returnReason ?? EMPTY,
    detail: returnItem.returnDetail ?? EMPTY,
    shippingFeeText: formatPrice(view.shippingFee),
    modal,
    isSubmitting,
    errorMessage: modal ? errorMessage : '',
    onOpen: (kind) => {
      setErrorMessage('');
      setModal(kind);
    },
    onClose: closeModal,
    onConfirm: () =>
      run(
        () => (modal === 'APPROVE' ? approveReturn(itemIdOf(returnItem)) : rejectReturn(itemIdOf(returnItem))),
        '반품을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
        () => setModal(null),
      ),
  };

  const refreshShipment = () => {
    if (refreshCooldown > 0) return;
    setRefreshCooldown(10);
    load().catch(() => {});
  };

  const { shipment } = view;
  const tracking = trackingOpen &&
    shipment?.events && {
      sellerName: '내 판매 주문',
      invoiceLabel: shipment.invoiceLabel,
      invoiceNo: shipment.trackingNo,
      events: shipment.events.length ? shipment.events : [{ time: EMPTY, status: NO_LOCATION }],
    };

  return (
    <>
      <SalesOrderDetailView
        order={view}
        accept={accept}
        returnRequest={returnRequest}
        refreshCooldown={refreshCooldown}
        onOpenTracking={() => setTrackingOpen(true)}
        onRefreshDistance={refreshShipment}
      />
      {tracking && (
        <TrackingModal
          tracking={tracking}
          refreshCooldown={refreshCooldown}
          onRefresh={refreshShipment}
          onCopy={() => navigator.clipboard?.writeText(shipment.trackingNo).catch(() => {})}
          onClose={() => setTrackingOpen(false)}
        />
      )}
    </>
  );
}

export default SalesOrderDetailPage;
