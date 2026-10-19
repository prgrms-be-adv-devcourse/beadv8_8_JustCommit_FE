import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { getOrder } from '../../api/orderApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatPrice } from '../../utils/format';
import styles from './OrderResult.module.css';

// 시안 5 주문 완료
// 주문서에서 넘어오면 결제 응답(orderNo·totalAmount)을 그대로 쓰고, 새로고침하면 주문 상세를 다시 조회
function OrderCompletePage() {
  usePageTitle('주문 완료');
  const { orderId } = useParams();
  const location = useLocation();
  const { isLoggedIn, isInitializing } = useAuth();

  const passedOrder = location.state?.order;
  const [fetchedOrder, setFetchedOrder] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const order = passedOrder ?? fetchedOrder;

  useEffect(() => {
    if (!isLoggedIn || passedOrder) return undefined;
    let ignore = false;

    getOrder(orderId)
      .then((response) => {
        // 주문 API는 ApiResponse로 감싸지 않고 DTO를 그대로 반환
        if (!ignore) setFetchedOrder(response.data.data ?? response.data);
      })
      .catch(() => {
        if (!ignore) setLoadError(true);
      });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, orderId, passedOrder]);

  if (isInitializing) {
    return <p className={styles.message}>불러오는 중...</p>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (loadError) {
    return <p className={styles.message}>주문 정보를 불러오지 못했어요. 주문 내역에서 확인해 주세요.</p>;
  }
  if (!order) {
    return <p className={styles.message}>불러오는 중...</p>;
  }

  return (
    <div className={styles.page}>
      <section aria-labelledby="done-title" className={styles.card}>
        <span className={`material-symbols-outlined ${styles.icon} ${styles.iconSuccess}`} aria-hidden="true">
          check
        </span>
        <h1 id="done-title" className={styles.title}>
          주문이 완료됐어요
        </h1>

        <dl className={styles.infoList}>
          <div className={styles.infoRow}>
            <dt>주문 번호</dt>
            <dd>{order.orderNo}</dd>
          </div>
          <div className={styles.infoRow}>
            <dt>결제 금액</dt>
            <dd className={styles.amount}>{formatPrice(Number(order.totalAmount))}</dd>
          </div>
          <div className={styles.infoRow}>
            <dt>결제 수단</dt>
            <dd>예치금</dd>
          </div>
        </dl>

        <p className={styles.notice}>
          <span className={`material-symbols-outlined ${styles.noticeIcon}`} aria-hidden="true">
            notifications
          </span>
          판매자가 발송하면 알림으로 알려 드려요
        </p>

        <div className={styles.actions}>
          <Link to={`/orders/${orderId}`} className={styles.secondaryButton}>
            주문 상세 보기
          </Link>
          <Link to="/" className={styles.primaryButton}>
            쇼핑 계속하기
          </Link>
        </div>
      </section>
    </div>
  );
}

export default OrderCompletePage;
