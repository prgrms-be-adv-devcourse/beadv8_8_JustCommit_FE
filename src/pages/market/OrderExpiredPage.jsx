import { Link } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import styles from './OrderResult.module.css';

// 시안 5-C 결제 시간 만료: 결제 대기 주문을 제한 시간(10분) 안에 결제하지 못했을 때
// TODO: 예치금 충전 → 결제 대기 주문 결제(POST /orders/{orderId}/pay) 흐름을 만들 때 EXPIRED 응답에서 연결
function OrderExpiredPage() {
  usePageTitle('결제 시간 만료');

  return (
    <div className={styles.page}>
      <section aria-labelledby="expired-title" className={styles.card}>
        <span className={`material-symbols-outlined ${styles.icon} ${styles.iconError}`} aria-hidden="true">
          schedule
        </span>
        <div className={styles.titleGroup}>
          <h1 id="expired-title" className={styles.title}>
            결제 시간이 지났어요
          </h1>
          <p className={styles.description}>주문을 다시 진행해 주세요</p>
        </div>
        <div className={styles.actions}>
          <Link to="/cart" className={styles.primaryButton}>
            장바구니로 돌아가기
          </Link>
        </div>
      </section>
    </div>
  );
}

export default OrderExpiredPage;
