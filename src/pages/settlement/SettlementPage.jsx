import { useEffect, useState } from 'react';
import BackLink from '../../components/common/BackLink';
import { Navigate } from 'react-router-dom';
import { getMySettlements } from '../../api/settlementApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatPrice } from '../../utils/format';
import styles from './SettlementPage.module.css';

function sumPayout(list) {
  return list.reduce((total, item) => total + item.payoutAmount, 0);
}

function isThisMonth(value) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

// "2026-10-15" → "2026.10.15"
function formatDate(value) {
  return value.slice(0, 10).replaceAll('-', '.');
}

function SettlementPage() {
  usePageTitle('정산');
  const { user, isLoggedIn, isInitializing } = useAuth();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [settlements, setSettlements] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error

  useEffect(() => {
    if (!canSell) return undefined;

    let ignore = false;
    getMySettlements()
      .then((response) => {
        if (ignore) return;
        setSettlements(response.data.data);
        setLoadState('done');
      })
      .catch(() => {
        if (!ignore) setLoadState('error');
      });

    return () => {
      ignore = true;
    };
  }, [canSell]);

  if (isInitializing) {
    return <p className={styles.message}>불러오는 중...</p>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/settlements' }} />;
  }
  if (!canSell) {
    return <Navigate to="/seller/register" replace />;
  }

  // TODO: 백엔드에 요약 API가 생기면 교체 (지금은 내역으로 계산)
  // 즉시 정산이라 내역은 모두 정산 완료 건
  const summary = [
    {
      key: 'month',
      label: '이번 달 정산 완료',
      amount: sumPayout(settlements.filter((item) => isThisMonth(item.date))),
    },
    { key: 'total', label: '누적 정산', amount: sumPayout(settlements) },
  ];

  const renderTable = () => {
    if (loadState === 'loading') {
      return <p className={styles.message}>정산 내역을 불러오는 중...</p>;
    }
    if (loadState === 'error') {
      return (
        <p className={styles.message}>정산 내역을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      );
    }
    if (settlements.length === 0) {
      return <div className={styles.empty}>아직 정산 내역이 없어요</div>;
    }

    return (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">날짜</th>
              <th scope="col">상품</th>
              <th scope="col" className={styles.right}>
                판매 금액
              </th>
              <th scope="col" className={styles.right}>
                수수료
              </th>
              <th scope="col" className={styles.right}>
                정산 금액
              </th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((item) => {
              return (
                <tr key={item.settlementId}>
                  <td className={styles.date}>{formatDate(item.date)}</td>
                  <td className={styles.name}>{item.productName}</td>
                  <td className={styles.right}>{formatPrice(item.saleAmount)}</td>
                  <td className={`${styles.right} ${styles.fee}`}>−{formatPrice(item.fee)}</td>
                  <td className={`${styles.right} ${styles.net}`}>
                    {formatPrice(item.payoutAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <BackLink to="/mypage" label="마이페이지" />
      <h1 className={styles.heading}>정산</h1>

      <div className={styles.summary}>
        {summary.map((card) => (
          <section
            key={card.key}
            className={`${styles.card} ${card.key === 'month' ? styles.highlight : ''}`}
          >
            <h2 className={styles.cardLabel}>{card.label}</h2>
            <strong className={styles.cardAmount}>
              {loadState === 'done' ? formatPrice(card.amount) : '-'}
            </strong>
          </section>
        ))}
      </div>

      <section aria-labelledby="settlement-title" className={styles.history}>
        <h2 id="settlement-title" className={styles.subheading}>
          정산 내역
        </h2>
        {renderTable()}
      </section>
    </div>
  );
}

export default SettlementPage;
