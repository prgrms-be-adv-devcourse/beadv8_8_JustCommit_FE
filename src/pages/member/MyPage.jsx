import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { getMyInfo } from '../../api/memberApi';
import { getWalletBalance } from '../../api/walletApi';
import { BANKS } from '../../constants/banks';
import { formatPrice } from '../../utils/format';
import styles from './MyPage.module.css';

const MENU = [
  { key: 'orders', to: '/orders', icon: 'receipt_long', label: '주문 내역' },
  { key: 'wallet', to: '/wallet', icon: 'account_balance_wallet', label: '예치금' },
  { key: 'addresses', to: '/mypage/addresses', icon: 'location_on', label: '배송지 관리' },
  { key: 'notifications', to: '/notifications', icon: 'notifications', label: '알림' },
];

const SELL_MENU = [
  { key: 'myProducts', to: '/mypage/products', icon: 'storefront', label: '판매 상품 목록' },
  { key: 'sales', to: '/orders/seller', icon: 'local_shipping', label: '판매 주문 목록' },
  { key: 'settlements', to: '/settlements', icon: 'payments', label: '정산' },
];

// 2026-10-15T16:22:48 → 2026.10.15
function formatJoinDate(value) {
  return value.slice(0, 10).replaceAll('-', '.');
}

function MenuLink({ item }) {
  return (
    <Link to={item.to} className={styles.menuItem}>
      <span className={`material-symbols-outlined ${styles.menuIcon}`} aria-hidden="true">{item.icon}</span>
      <span className={styles.menuLabel}>{item.label}</span>
      <span className={`material-symbols-outlined ${styles.chevron}`} aria-hidden="true">chevron_right</span>
    </Link>
  );
}



// 은행 코드 → 짧은 이름 (목록에 없는 코드면 빈 문자열 → 은행 이름 없이 계좌번호만 표시)
function getBankName(code) {
  return BANKS.find((bank) => bank.code === code)?.shortName ?? '';
}

function MyPage() {
  usePageTitle('마이페이지');
  const { isLoggedIn, isInitializing } = useAuth();

  const [myInfo, setMyInfo] = useState(null);
  const [balance, setBalance] = useState(null); // null = 조회 실패 또는 로딩 중
  const [loadError, setLoadError] = useState('');

  // 내 정보와 예치금을 동시에 조회 (예치금이 실패해도 페이지는 열림)
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;

    Promise.allSettled([getMyInfo(), getWalletBalance()]).then(([info, wallet]) => {
      if (ignore) return;
      if (info.status === 'fulfilled') {
        setMyInfo(info.value.data.data);
      } else {
        setLoadError(info.reason.response?.data?.message ?? '내 정보를 불러오지 못했습니다.');
      }
      if (wallet.status === 'fulfilled') {
        setBalance(wallet.value.data.data.balance);
      }
    });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);


  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (loadError) return <p className={styles.status} role="alert">{loadError}</p>;
  if (!myInfo) return <p className={styles.status}>내 정보를 불러오는 중...</p>;

  const isSeller = myInfo.role === 'SELLER';

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>마이페이지</h1>

      <div className={styles.summary}>
        <section aria-label="프로필" className={`${styles.card} ${styles.profile}`}>
          <span className={styles.avatar} aria-hidden="true">{myInfo.nickname.slice(0, 1)}</span>
          <div className={styles.profileText}>
            <strong className={styles.nickname}>{myInfo.nickname}</strong>
            <span className={styles.email}>{myInfo.email}</span>
            {myInfo.createdAt && <span className={styles.joinedAt}>가입일 {formatJoinDate(myInfo.createdAt)}</span>}
          </div>
        </section>

        <section aria-label="예치금" className={`${styles.card} ${styles.wallet}`}>
          <div className={styles.walletTop}>
            <Link to="/wallet" className={styles.walletLink}>
              <span className={styles.walletLabel}>보유 예치금</span>
              <strong className={styles.walletAmount}>{balance === null ? '-' : formatPrice(balance)}</strong>
            </Link>
            <Link to="/deposit/charge" className={styles.chargeButton}>충전하기</Link>
          </div>
          {/* 환불·예치금 환급과 판매 정산금 지급에 같이 쓰는 계좌 (번호는 백엔드가 마스킹) */}
          {myInfo.account && (
            <p className={styles.account}>
              <span className={styles.accountLabel}>등록 계좌</span>
              <span>
                {[getBankName(myInfo.account.bankCode), myInfo.account.maskedAccountNo].filter(Boolean).join(' ')} (
                {myInfo.account.accountHolder})
              </span>
            </p>
          )}
        </section>
      </div>

      <nav aria-label="내 메뉴" className={styles.menu}>
        {MENU.map((item) => (
          <MenuLink key={item.key} item={item} />
        ))}
      </nav>

      {isSeller ? (
        <nav aria-labelledby="sell-title" className={styles.menu}>
          <h2 id="sell-title" className={styles.menuTitle}>판매</h2>
          {SELL_MENU.map((item) => (
            <MenuLink key={item.key} item={item} />
          ))}
        </nav>
      ) : (
        <section aria-labelledby="sell-banner" className={styles.sellBanner}>
          <span className={`material-symbols-outlined ${styles.bannerIcon}`} aria-hidden="true">potted_plant</span>
          <h2 id="sell-banner" className={styles.bannerTitle}>식물을 판매해 보세요</h2>
          <Link to="/seller/register" className={styles.bannerButton}>판매자 등록하기</Link>
        </section>
      )}

    </div>
  );
}

export default MyPage;
