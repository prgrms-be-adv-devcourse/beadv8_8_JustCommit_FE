import { Link, useSearchParams } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import styles from './Charge.module.css';

// 충전 실패 카드 (토스 실패 화면, 승인 실패 모두 사용)
export function ChargeFailCard({ detail }) {
  return (
    <div className={styles.page}>
      <section aria-labelledby="cf-title" className={`${styles.card} ${styles.resultCard}`}>
        <span className={`material-symbols-outlined ${styles.resultIcon} ${styles.resultIconFail}`} aria-hidden="true">
          warning
        </span>
        <div className={styles.resultText}>
          <h1 id="cf-title" className={styles.resultTitle}>
            충전하지 못했어요
          </h1>
          <p className={styles.resultDesc}>결제가 취소됐거나 실패했어요. 예치금은 바뀌지 않았어요</p>
          {detail && <p className={styles.resultDetail}>{detail}</p>}
        </div>
        <Link to="/deposit/charge" className={styles.primaryButton}>
          다시 충전하기
        </Link>
      </section>
    </div>
  );
}

// 토스가 결제 실패·취소 시 이동시키는 화면 (?code=...&message=...&orderId=...)
function ChargeFailPage() {
  usePageTitle('충전 실패');
  const [searchParams] = useSearchParams();
  return <ChargeFailCard detail={searchParams.get('message')} />;
}

export default ChargeFailPage;
