import { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getAddresses } from '../../api/memberApi';
import { approveReturn, rejectReturn, respondSellerOrder } from '../../api/orderApi';
import ErrorPage from '../../components/common/ErrorPage';
import { SHIPPING_FEE_PER_SELLER } from '../../constants/order';
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
import SalesOrderDetailView from './SalesOrderDetailView';
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
// TODO: 구매자 닉네임(buyerNickname) · 취소 주체(cancelledBy) · 반송 중 여부(returnShipping) · 현재 위치(currentLocation) ·
//       배송 조회 주소(trackingUrl) · 반품 사유(returnReason · returnDetail) · 반품 신청 시각(returnRequestedAt) ·
//       결제 완료 시각(paidAt) · 판매자 부담금(sellerBurden)이 응답에 생기면 그대로 쓰임. 없으면 기본값(emptyText)
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
    if (item.status === 'REFUND_REQUESTED') {
      statusText = '반품 신청';
      statusTone = 'text-[#92400e]';
    }
    if (item.status === 'REFUNDED') statusText = '반품 완료';
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
  const liveItems = items.filter((item) => item.status !== 'CANCELLED');
  const sale = liveItems.reduce((sum, item) => sum + Number(item.price), 0);
  const fee = Math.floor(sale * SETTLEMENT_FEE_RATE);
  const burden = Number(order.sellerBurden ?? 0);

  let settlement;
  if (salesStatus === 'CANCELLED') {
    settlement = {
      badgeText: cancelLabel,
      badgeTone: GRAY_BADGE,
      amounts: null,
      note: order.cancelledBy === 'BUYER' ? '구매자가 취소한 주문이라 정산하지 않아요.' : '거절한 주문이라 정산하지 않아요.',
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
  const shipment =
    mode === 'ACCEPT'
      ? null
      : {
          trackingNo: order.trackingNo ?? NO_TRACKING_NO,
          note: step === 0 && mode === 'NORMAL' ? '수락하면 택배사가 자동으로 예약돼요. 상품을 포장해 두면 택배사가 가지러 가요.' : null,
          step: mode === 'CANCEL_RETURN' ? null : step,
          // 시안: 배송 완료 시각만 단계 아래에 보여 줌
          stepTimes: [null, null, null, order.deliveredAt ? formatShortDateTime(order.deliveredAt) : null, null],
          location: order.currentLocation ?? NO_LOCATION,
          trackingUrl: order.trackingUrl ?? '#',
        };

  return {
    sellerOrderId: order.sellerOrderId,
    mode,
    headerText: `주문 번호 ${orEmpty(order.orderNo)} · ${formatDateTime(order.createdAt)} · 구매자 ${order.buyerNickname ?? EMPTY}`,
    items: viewItems,
    saleFooter:
      mode === 'CANCEL_RETURN'
        ? null
        : { label: `판매액 (배송비 ${formatPrice(shippingFee)}은 구매자가 냄)`, amountText: formatPrice(sale) },
    recipient: {
      name: order.recipientName,
      phone: maskPhone(order.recipientPhone),
      address: `(${orEmpty(order.zipcode)}) ${orEmpty(order.address1)}${order.address2 ? `, ${order.address2}` : ''}`,
    },
    shipment,
    settlement,
    returnItem: items.find((item) => item.status === 'REFUND_REQUESTED') ?? null,
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

  const load = useCallback(
    () =>
      fetchSalesOrder(sellerOrderId).then((data) => {
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
    reason: returnItem.returnReason ?? EMPTY,
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

  return <SalesOrderDetailView order={view} accept={accept} returnRequest={returnRequest} />;
}

export default SalesOrderDetailPage;
