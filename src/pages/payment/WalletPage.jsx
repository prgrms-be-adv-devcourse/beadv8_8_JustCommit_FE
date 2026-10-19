import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import BackLink from '../../components/common/BackLink';
import { getWalletTransactions } from '../../api/walletApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import { formatPrice } from '../../utils/format';
import styles from './WalletPage.module.css';

// TODO: 백엔드가 거래 종류를 여러 개 받게 되면 탭별로 서버에서 조회하고 페이지 단위로 불러오기
// 지금은 최근 거래를 한 번에 받아서 탭별로 화면에서 거름
const FETCH_SIZE = 100;

// 거래 종류(백엔드 RefType)별 표시 이름·아이콘
const REF_TYPE = {
  CHARGE: { label: '충전', icon: 'add_card' },
  CHARGE_CANCEL: { label: '충전 취소', icon: 'credit_card_off' },
  PAYMENT: { label: '상품 결제', icon: 'shopping_bag' },
  SHIPPING_FEE: { label: '배송비', icon: 'local_shipping' },
  ORDER_REFUND: { label: '환불', icon: 'undo' },
  ORDER_ITEM_CANCEL_REFUND: { label: '주문 취소 환불', icon: 'undo' },
  SHIPPING_FEE_REFUND: { label: '배송비 환불', icon: 'undo' },
  SETTLEMENT: { label: '판매 정산', icon: 'payments' },
  SETTLEMENT_FEE: { label: '정산 수수료', icon: 'receipt' },
  CASH_OUT: { label: '출금', icon: 'account_balance' },
  CASH_OUT_CANCEL: { label: '출금 취소', icon: 'account_balance' },
};

// 탭: 같은 성격의 거래 종류를 묶음 (결제 = 상품 결제 + 배송비 등)
const TABS = [
  { key: 'ALL', label: '전체', types: null },
  { key: 'CHARGE', label: '충전', types: ['CHARGE', 'CHARGE_CANCEL'] },
  { key: 'PAYMENT', label: '결제', types: ['PAYMENT', 'SHIPPING_FEE'] },
  { key: 'REFUND', label: '환불', types: ['ORDER_REFUND', 'ORDER_ITEM_CANCEL_REFUND', 'SHIPPING_FEE_REFUND'] },
  { key: 'SETTLEMENT', label: '정산', types: ['SETTLEMENT', 'SETTLEMENT_FEE', 'CASH_OUT', 'CASH_OUT_CANCEL'] },
];

const EMPTY_TEXT = {
  ALL: '거래가 발생하면 여기에 내역이 표시돼요.',
  CHARGE: '예치금을 충전하면 여기에 내역이 표시돼요.',
  PAYMENT: '상품을 결제하면 여기에 내역이 표시돼요.',
  REFUND: '환불이 완료되면 여기에 내역이 표시돼요.',
  SETTLEMENT: '판매 정산이 완료되면 여기에 내역이 표시돼요.',
};

// 2026-10-16T15:12:31 → 2026.10.16
function formatDate(value) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}.${month}.${day}`;
}

function WalletPage() {
  usePageTitle('예치금');
  const { isLoggedIn, isInitializing } = useAuth();
  const { balance, refreshWallet } = useWallet();

  const [transactions, setTransactions] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error
  const [tab, setTab] = useState('ALL');

  // 들어올 때마다 잔액·거래 내역을 최신으로
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    let ignore = false;
    refreshWallet().catch(() => {});
    getWalletTransactions({ size: FETCH_SIZE })
      .then((response) => {
        if (ignore) return;
        setTransactions(response.data.data.content ?? []);
        setLoadState('done');
      })
      .catch((error) => {
        if (ignore) return;
        // 지갑이 아직 없는 회원은 거래도 없음
        if (error.response?.data?.code === 'WALLET_NOT_FOUND') {
          setTransactions([]);
          setLoadState('done');
        } else {
          setLoadState('error');
        }
      });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, refreshWallet]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/wallet' }} />;

  const currentTab = TABS.find((item) => item.key === tab);
  const rows = currentTab.types
    ? transactions.filter((item) => currentTab.types.includes(item.refType))
    : transactions;
  const emptyTitle = tab === 'ALL' ? '아직 거래 내역이 없어요' : `${currentTab.label} 내역이 없어요`;

  const renderList = () => {
    if (loadState === 'loading') {
      return <p className={styles.message}>거래 내역을 불러오는 중...</p>;
    }
    if (loadState === 'error') {
      return <p className={styles.message}>거래 내역을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>;
    }
    if (rows.length === 0) {
      return (
        <div className={styles.empty}>
          <span className={`material-symbols-outlined ${styles.emptyIcon}`} aria-hidden="true">
            receipt_long
          </span>
          <h3 className={styles.emptyTitle}>{emptyTitle}</h3>
          <p className={styles.emptyText}>{EMPTY_TEXT[tab]}</p>
        </div>
      );
    }

    return (
      <ul className={styles.list}>
        {rows.map((item) => {
          const type = REF_TYPE[item.refType] ?? { label: item.refType, icon: 'receipt' };
          const isIn = item.status === 'IN';
          return (
            <li key={item.transactionId} className={styles.row}>
              <span className={styles.date}>{formatDate(item.createdAt)}</span>
              <span className={`material-symbols-outlined ${styles.icon}`} aria-hidden="true">
                {type.icon}
              </span>
              <span className={styles.info}>
                <strong className={styles.type}>{type.label}</strong>
                <span className={styles.desc}>거래 후 잔액 {formatPrice(Number(item.balanceAfter))}</span>
              </span>
              <strong className={`${styles.amount} ${isIn ? styles.amountIn : styles.amountOut}`}>
                {isIn ? '+' : '-'}
                {formatPrice(Number(item.amount))}
              </strong>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={styles.page}>
      <BackLink to="/mypage" label="마이페이지" />
      <h1 className={styles.heading}>예치금</h1>

      <section aria-label="보유 예치금" className={styles.balanceCard}>
        <div className={styles.balanceText}>
          <span className={styles.balanceLabel}>보유 예치금</span>
          <strong className={styles.balanceAmount}>
            {balance === null ? '-' : formatPrice(Number(balance))}
          </strong>
        </div>
        <div className={styles.balanceActions}>
          {/* TODO: 충전 내역 화면 시안이 나오면 별도 화면으로 연결 (지금은 충전 탭 선택) */}
          <button type="button" className={styles.historyLink} onClick={() => setTab('CHARGE')}>
            충전 내역
          </button>
          <Link to="/deposit/charge" className={styles.chargeButton}>
            <span className="material-symbols-outlined" aria-hidden="true">
              add_card
            </span>
            충전하기
          </Link>
        </div>
      </section>

      <section aria-labelledby="tx-title" className={styles.txSection}>
        <h2 id="tx-title" className={styles.txTitle}>
          거래 내역
        </h2>
        <div role="tablist" aria-label="거래 종류" className={styles.tabs}>
          {TABS.map((item) => {
            const isSelected = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`${styles.tab} ${isSelected ? styles.tabSelected : ''}`}
                onClick={() => setTab(item.key)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        {renderList()}
      </section>
    </div>
  );
}

export default WalletPage;
