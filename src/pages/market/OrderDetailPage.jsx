import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { cancelOrderItem, confirmOrderItem, getOrder } from '../../api/orderApi';
import ConfirmModal from '../../components/common/ConfirmModal';
import ProductThumbnail from '../../components/product/ProductThumbnail';
import {
  AUTO_CONFIRM_DAYS,
  CANCELABLE_SHIPMENT_STATUSES,
  ORDER_ITEM_STATUS,
  SHIPMENT_STATUS,
  SHIPMENT_STEPS,
} from '../../constants/order';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDateTime, formatPrice, maskPhone } from '../../utils/format';
import styles from './OrderDetailPage.module.css';

const ACTIONS = {
  cancel: {
    request: cancelOrderItem,
    icon: 'block',
    title: '이 상품을 취소할까요?',
    message: (item) => `"${item.productName}" 결제 금액이 예치금으로 돌아가요.`,
    confirmText: '상품 취소',
    failText: '상품을 취소하지 못했어요. 잠시 후 다시 시도해 주세요.',
  },
  confirm: {
    request: confirmOrderItem,
    icon: 'check_circle',
    title: '구매를 확정할까요?',
    message: (item) =>
      `"${item.productName}" 구매를 확정하면 판매자에게 정산되고, 취소할 수 없어요.`,
    confirmText: '구매 확정',
    failText: '구매를 확정하지 못했어요. 잠시 후 다시 시도해 주세요.',
  },
};

// 주문 API는 ApiResponse로 감싸지 않고 DTO를 그대로 반환
async function fetchOrder(orderId) {
  const response = await getOrder(orderId);
  return response.data.data ?? response.data;
}

// "10.12" 형태 (배송 완료일·자동 구매 확정 예정일 안내용)
function formatMonthDay(date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

// 상품 상태 배지: 진행 중(NORMAL)이면 배송 상태로, 아니면 주문 상품 상태로 보여 준다
function getItemBadge(item, sellerOrder) {
  if (item.status !== 'NORMAL') {
    return ORDER_ITEM_STATUS[item.status] ?? { label: item.status, tone: 'closed' };
  }
  return SHIPMENT_STATUS[sellerOrder.shipmentStatus] ?? { label: '결제 완료', tone: 'paid' };
}

// 배송 완료 안내: "10.12 배송 완료 · 10.15 자동 구매 확정 예정"
function getDeliveryNote(item, sellerOrder) {
  if (
    item.status !== 'NORMAL' ||
    sellerOrder.shipmentStatus !== 'DELIVERED' ||
    !sellerOrder.deliveredAt
  ) {
    return null;
  }
  const delivered = new Date(sellerOrder.deliveredAt);
  const autoConfirm = new Date(delivered);
  autoConfirm.setDate(autoConfirm.getDate() + AUTO_CONFIRM_DAYS);
  return `${formatMonthDay(delivered)} 배송 완료 · ${formatMonthDay(autoConfirm)} 자동 구매 확정 예정`;
}

// 택배 수거 전(접수 준비·택배 예약)인 진행 중 상품만 취소 가능
function isCancelable(order, item, sellerOrder) {
  return (
    order.status === 'PAID' &&
    item.status === 'NORMAL' &&
    CANCELABLE_SHIPMENT_STATUSES.includes(sellerOrder.shipmentStatus)
  );
}

// "10/19 10:07" 형태 (배송 단계 아래 시각)
function formatStepTime(value) {
  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`;
}

function ShipmentSteps({ sellerOrder }) {
  const currentStep = SHIPMENT_STATUS[sellerOrder.shipmentStatus]?.step ?? 0;

  return (
    <ol aria-label="배송 단계" className={styles.steps}>
      {SHIPMENT_STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber <= currentStep;
        const isCurrent = stepNumber === currentStep;
        // 지난 단계이고 시각 값이 있을 때만 표시 (백엔드에 아직 없는 필드는 undefined → 숨김)
        const time = isDone ? sellerOrder[step.timeField] : null;
        return (
          <li
            key={step.label}
            aria-current={isCurrent ? 'step' : undefined}
            className={`${styles.step} ${isDone ? styles.stepDone : ''} ${isCurrent ? styles.stepCurrent : ''}`}
          >
            {index > 0 && <span aria-hidden="true" className={styles.stepLine} />}
            <span aria-hidden="true" className={styles.stepCircle}>
              <span className="material-symbols-outlined">{isDone ? 'check' : step.icon}</span>
            </span>
            <span className={styles.stepLabel}>{step.label}</span>
            {time && (
              <time className={styles.stepTime} dateTime={time}>
                {formatStepTime(time)}
              </time>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function OrderDetailPage() {
  usePageTitle('주문 상세');
  const { orderId } = useParams();
  const { isLoggedIn, isInitializing } = useAuth();

  const [order, setOrder] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error | notFound
  const [pending, setPending] = useState(null); // { type: 'cancel' | 'confirm', item }
  const [busyItemId, setBusyItemId] = useState(null);
  const [notice, setNotice] = useState(null);

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

  // ConfirmModal의 useEffect가 onClose에 의존하므로 함수 고정
  const closePending = useCallback(() => setPending(null), []);
  const closeNotice = useCallback(() => setNotice(null), []);

  if (isInitializing) {
    return <p className={styles.message}>불러오는 중...</p>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: `/orders/${orderId}` }} />;
  }
  if (loadState === 'loading') {
    return <p className={styles.message}>주문 정보를 불러오는 중...</p>;
  }
  if (loadState === 'notFound') {
    return (
      <div className={styles.message}>
        <p>주문을 찾을 수 없어요.</p>
        <Link to="/orders" className={styles.backLink}>
          주문 목록으로
        </Link>
      </div>
    );
  }
  if (loadState === 'error') {
    return (
      <p className={styles.message}>주문 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
    );
  }

  const sellerOrders = order.sellerOrders ?? [];
  const itemTotal = sellerOrders.reduce(
    (sum, sellerOrder) =>
      sum + sellerOrder.items.reduce((acc, item) => acc + Number(item.price), 0),
    0,
  );
  const shippingTotal = sellerOrders.reduce(
    (sum, sellerOrder) => sum + Number(sellerOrder.shippingFee ?? 0),
    0,
  );
  const itemCount = sellerOrders.reduce((sum, sellerOrder) => sum + sellerOrder.items.length, 0);

  const hasAutoConfirmTarget =
    order.status === 'PAID' &&
    sellerOrders.some((sellerOrder) => sellerOrder.items.some((item) => item.status === 'NORMAL'));

  const runAction = async () => {
    const { type, item } = pending;
    const action = ACTIONS[type];
    setPending(null);
    setBusyItemId(item.id);
    try {
      await action.request(item.id);
      // 상태·배지·버튼이 서버 기준으로 바뀌도록 다시 조회
      setOrder(await fetchOrder(orderId));
    } catch (error) {
      setNotice(error.response?.data?.message ?? action.failText);
    } finally {
      setBusyItemId(null);
    }
  };

  const pendingAction = pending && ACTIONS[pending.type];

  return (
    <div className={styles.page}>
      <Link to="/orders" className={styles.backLink}>
        <span className="material-symbols-outlined" aria-hidden="true">
          arrow_back
        </span>
        주문 목록
      </Link>
      <h1 className={styles.heading}>주문 상세</h1>

      <section aria-labelledby="info-title" className={styles.infoCard}>
        <h2 id="info-title" className={styles.sectionTitle}>
          주문 정보
        </h2>
        <dl className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <dt>주문 번호</dt>
            <dd className={styles.numeric}>{order.orderNo}</dd>
          </div>
          <div className={styles.infoItem}>
            <dt>주문 일시</dt>
            <dd className={styles.numeric}>{formatDateTime(order.createdAt)}</dd>
          </div>
          <div className={styles.infoItem}>
            <dt>결제 금액 (예치금)</dt>
            <dd className={styles.amountBox}>
              <strong className={styles.totalAmount}>
                {formatPrice(Number(order.totalAmount))}
              </strong>
              <span className={styles.amountDetail}>
                상품 {formatPrice(itemTotal)} + 배송비 {formatPrice(shippingTotal)}
              </span>
            </dd>
          </div>
          <div className={styles.infoItem}>
            <dt>배송지</dt>
            <dd className={styles.address}>
              {order.recipientName} · {maskPhone(order.recipientPhone)}
              <br />
              {order.address1} {order.address2}
            </dd>
          </div>
        </dl>
      </section>
      {hasAutoConfirmTarget && (
      <div className={styles.notice}>
        <span className="material-symbols-outlined" aria-hidden="true">
          schedule
        </span>
        배송 완료 {AUTO_CONFIRM_DAYS}일 뒤 자동으로 구매 확정돼요
      </div>
      )}

      <section aria-labelledby="goods-title" className={styles.goods}>
        <h2 id="goods-title" className={styles.sectionTitle}>
          주문 상품{' '}
          <span className={styles.goodsCount}>
            {itemCount}개 · 판매자 {sellerOrders.length}명
          </span>
        </h2>

        {sellerOrders.map((sellerOrder, index) => (
          <div key={sellerOrder.id} className={styles.sellerGroup}>
            <div className={styles.sellerHeader}>
              <span className="material-symbols-outlined" aria-hidden="true">
                storefront
              </span>
              {/* TODO: 주문 상세 응답에 판매자 닉네임이 생기면 교체 (지금은 sellerId만 있음) */}
              <strong>판매자 {index + 1}</strong>
              <span className={styles.shippingFee}>
                배송비 {formatPrice(Number(sellerOrder.shippingFee ?? 0))}
              </span>
            </div>

            <ul className={styles.itemList}>
              {sellerOrder.items.map((item) => {
                const badge = getItemBadge(item, sellerOrder);
                const note = getDeliveryNote(item, sellerOrder);
                const canCancel = isCancelable(order, item, sellerOrder);
                const canConfirm = item.purchaseConfirmable;
                const showSteps =
                  (item.status === 'NORMAL' || item.status === 'CONFIRMED') &&
                  (SHIPMENT_STATUS[sellerOrder.shipmentStatus]?.step ?? 0) > 0;
                const isBusy = busyItemId === item.id;

                return (
                  <li key={item.id} className={styles.item}>
                    <div className={`${styles.itemRow} ${badge.muted ? styles.muted : ''}`}>
                      <Link
                        to={`/products/${item.productId}`}
                        state={{ orderItem: { productName: item.productName, price: item.price } }}
                        className={styles.thumb}
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        {/* 상품 사진. 없으면(사진 없는 상품·삭제된 상품) 대체 썸네일 */}
                        <ProductThumbnail src={item.thumbnailUrl} alt="" size="small" />
                      </Link>
                      <span className={styles.itemInfo}>
                        <Link
                          to={`/products/${item.productId}`}
                          state={{ orderItem: { productName: item.productName, price: item.price } }}
                          className={styles.itemName}
                        >
                          {item.productName}
                        </Link>
                        <strong className={styles.itemPrice}>
                          {formatPrice(Number(item.price))}
                        </strong>
                      </span>
                      <span className={`${styles.badge} ${styles[badge.tone]}`}>{badge.label}</span>
                    </div>

                    {showSteps && <ShipmentSteps sellerOrder={sellerOrder} />}

                    {item.status === 'CANCELLED' && (
                      <p className={styles.cancelledNote}>
                        <span className="material-symbols-outlined" aria-hidden="true">
                          block
                        </span>
                        수거 전에 취소된 상품이에요.
                      </p>
                    )}

                    {(note || canCancel || canConfirm) && (
                      <div className={styles.itemFooter}>
                        <span className={styles.deliveryNote}>{note}</span>
                        {canCancel && (
                          <button
                            type="button"
                            className={styles.cancelButton}
                            disabled={isBusy}
                            onClick={() => setPending({ type: 'cancel', item })}
                          >
                            취소
                          </button>
                        )}
                        {canConfirm && (
                          <button
                            type="button"
                            className={styles.confirmButton}
                            disabled={isBusy}
                            onClick={() => setPending({ type: 'confirm', item })}
                          >
                            구매 확정
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      {pendingAction && (
        <ConfirmModal
          icon={pendingAction.icon}
          title={pendingAction.title}
          message={pendingAction.message(pending.item)}
          confirmText={pendingAction.confirmText}
          cancelText="닫기"
          onConfirm={runAction}
          onClose={closePending}
        />
      )}

      {notice && (
        <ConfirmModal
          icon="info"
          title="처리하지 못했어요"
          message={notice}
          confirmText="확인"
          cancelText={null}
          onConfirm={closeNotice}
          onClose={closeNotice}
        />
      )}
    </div>
  );
}

export default OrderDetailPage;
