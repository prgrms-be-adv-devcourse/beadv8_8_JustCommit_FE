import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import ProductThumbnail from '../../components/product/ProductThumbnail';
import { SETTLEMENT_FEE_RATE, getSalesStatus } from '../../constants/order';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import {
  formatDate,
  formatDateTime,
  formatPrice,
  formatStepTime,
  maskPhone,
} from '../../utils/format';
import { fetchSalesOrder } from './salesOrderLoader';
import styles from './SalesOrderDetailPage.module.css';

// timeField: 판매 주문 상세 응답에서 그 단계가 일어난 시각 (아직 안 된 단계는 null → 시각을 안 보여 줌)
const STEPS = [
  { label: '택배 예약', icon: 'event_available', timeField: 'bookedAt' },
  { label: '접수 완료', icon: 'inventory_2', timeField: 'pickedUpAt' },
  { label: '배송 중', icon: 'local_shipping', timeField: 'inTransitAt' },
  { label: '배송 완료', icon: 'home', timeField: 'deliveredAt' },
];

// 지금 진행 중인 단계 (STEPS 인덱스, 4면 모든 단계 완료)
function getCurrentStep(order, salesStatus) {
  if (salesStatus === 'CONFIRMED') return 4;
  switch (order.shipmentStatus) {
    case 'BOOKED':
      return 1;
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      return 2;
    case 'DELIVERED':
      return 3;
    default:
      return 0;
  }
}

const ITEM_STATUS_LABEL = {
  CANCELLED: '취소됨',
  REFUND_REQUESTED: '환불 요청',
  REFUNDED: '환불 완료',
  CONFIRMED: '구매 확정',
};

function SalesOrderDetailPage() {
  usePageTitle('판매 주문 상세');
  const { sellerOrderId } = useParams();
  const { user, isLoggedIn, isInitializing } = useAuth();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [order, setOrder] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error

  useEffect(() => {
    if (!canSell) return undefined;

    let ignore = false;
    fetchSalesOrder(sellerOrderId)
      .then((data) => {
        if (ignore) return;
        setOrder(data);
        setLoadState('done');
      })
      .catch(() => {
        if (!ignore) setLoadState('error');
      });

    return () => {
      ignore = true;
    };
  }, [canSell, sellerOrderId]);

  if (isInitializing) {
    return <p className={styles.message}>불러오는 중...</p>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: `/orders/seller/${sellerOrderId}` }} />;
  }
  if (!canSell) {
    return <Navigate to="/seller/register" replace />;
  }

  const backLink = (
    <Link to="/orders/seller" className={styles.backLink}>
      <span className="material-symbols-outlined" aria-hidden="true">
        arrow_back
      </span>
      판매 주문
    </Link>
  );

  if (loadState !== 'done') {
    return (
      <div className={styles.page}>
        {backLink}
        <p className={styles.message}>
          {loadState === 'loading'
            ? '주문을 불러오는 중...'
            : '주문을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'}
        </p>
      </div>
    );
  }

  const salesStatus = getSalesStatus(order);
  const currentStep = getCurrentStep(order, salesStatus);
  const items = order.items ?? [];
  const shippingFee = Number(order.shippingFee ?? 0);
  const saleAmount = Number(order.totalAmount) - shippingFee;

  // 정산 기준: 구매 확정된 상품 금액 (백엔드 SellerOrder.settlementBaseAmount와 같은 기준)
  const isConfirmed = salesStatus === 'CONFIRMED';
  // 백엔드는 정산 행이 있으면 COMPLETED, 없으면 NOT_SETTLED
  const isSettled = order.settlementStatus === 'COMPLETED';
  const settleBase = items
    .filter((item) => item.status === 'CONFIRMED')
    .reduce((sum, item) => sum + Number(item.price), 0);
  const fee = Math.floor(settleBase * SETTLEMENT_FEE_RATE);

  return (
    <div className={styles.page}>
      {backLink}

      <div className={styles.titleBlock}>
        <h1 className={styles.heading}>판매 주문 상세</h1>
        <p className={styles.meta}>
          주문 번호 {order.orderNo} · {formatDateTime(order.createdAt)} · 구매자{' '}
          {order.recipientName}
        </p>
      </div>

      <div className={styles.grid}>
        <section aria-labelledby="sod-addr" className={styles.card}>
          <h2 id="sod-addr" className={styles.cardTitle}>
            구매자 배송지
          </h2>
          <strong className={styles.recipient}>{order.recipientName}</strong>
          <span className={styles.subText}>{maskPhone(order.recipientPhone)}</span>
          <span className={styles.address}>
            ({order.zipcode}) {order.address1}
            {order.address2 ? `, ${order.address2}` : ''}
          </span>
        </section>

        <section aria-labelledby="sod-item" className={styles.card}>
          <h2 id="sod-item" className={styles.cardTitle}>
            주문 상품
          </h2>
          <ul className={styles.items}>
            {items.map((item) => (
              <li key={item.id} className={styles.item}>
                <Link to={`/products/${item.productId}`} className={styles.itemThumb} tabIndex={-1}>
                  <ProductThumbnail
                    src={item.thumbnailUrl}
                    alt={`${item.productName} 사진`}
                    size="small"
                  />
                </Link>
                <span className={styles.itemInfo}>
                  {ITEM_STATUS_LABEL[item.status] && (
                    <span className={styles.itemStatus}>{ITEM_STATUS_LABEL[item.status]}</span>
                  )}
                  {item.speciesName && <span className={styles.species}>{item.speciesName}</span>}
                  <span className={styles.itemName}>{item.productName}</span>
                  <span className={styles.subText}>{formatPrice(Number(item.price))}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className={styles.totalRow}>
            <span className={styles.subText}>판매 금액</span>
            <strong className={styles.total}>{formatPrice(saleAmount)}</strong>
          </div>
        </section>
      </div>

      <section aria-labelledby="sod-ship" className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 id="sod-ship" className={styles.cardTitle}>
            배송
          </h2>
          {order.trackingNo && (
            <span className={styles.subText}>
              송장번호 <strong className={styles.trackingNo}>{order.trackingNo}</strong>
              <span className={styles.autoBadge}>자동 발급</span>
            </span>
          )}
        </div>
        <ol aria-label="배송 단계" className={styles.steps}>
          {STEPS.map((step, index) => {
            const done = index < currentStep;
            const now = index === currentStep;
            const stateClass = done ? styles.stepDone : now ? styles.stepNow : '';
            const time = order[step.timeField];
            return (
              <li
                key={step.label}
                aria-current={now ? 'step' : undefined}
                className={`${styles.step} ${stateClass}`}
              >
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className={`${styles.stepLine} ${index <= currentStep ? styles.stepLineDone : ''}`}
                  />
                )}
                <span aria-hidden="true" className={styles.stepDot}>
                  <span className="material-symbols-outlined">
                    {done ? 'check' : now ? step.icon : ''}
                  </span>
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
      </section>

      <section aria-labelledby="sod-settle" className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 id="sod-settle" className={styles.cardTitle}>
            정산
          </h2>
          {isSettled ? (
            <span className={`${styles.settleBadge} ${styles.settleDone}`}>정산 완료</span>
          ) : (
            <span className={`${styles.settleBadge} ${isConfirmed ? styles.settleScheduled : ''}`}>
              {isConfirmed ? '정산 예정' : '정산 전'}
            </span>
          )}
        </div>
        {isConfirmed || isSettled ? (
          <>
            <dl className={styles.settleList}>
              <div>
                <dt>판매 금액</dt>
                <dd>{formatPrice(settleBase)}</dd>
              </div>
              <div>
                <dt>수수료</dt>
                <dd className={styles.fee}>−{formatPrice(fee)}</dd>
              </div>
              <div className={styles.divider} />
              <div className={styles.settleTotal}>
                <dt>정산 금액</dt>
                <dd>{formatPrice(settleBase - fee)}</dd>
              </div>
            </dl>
            <p className={styles.subText}>
              {isSettled
                ? `${order.settledAt ? `${formatDate(order.settledAt)}에 ` : ''}정산됐어요.`
                : '구매가 확정돼 정산을 기다리고 있어요.'}
            </p>
          </>
        ) : (
          <p className={styles.settleNotice}>
            <span className="material-symbols-outlined" aria-hidden="true">
              schedule
            </span>
            구매 확정 후 정산돼요
          </p>
        )}
      </section>
    </div>
  );
}

export default SalesOrderDetailPage;
