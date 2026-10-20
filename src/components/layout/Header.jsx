import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import useNotification from '../../hooks/useNotification';
import useWallet from '../../hooks/useWallet';
import { formatPrice } from '../../utils/format';
import styles from './Header.module.css';

// 로그인해야 볼 수 있는 페이지 (여기서 로그아웃하면 로그인 화면으로 이동)
const AUTH_REQUIRED_PATHS = ['/mypage', '/seller/register'];

// 검색창: 입력값은 initialKeyword로 시작 (Header가 URL 검색어를 key로 넘겨서, 검색어가 바뀌면 새로 만들어짐)
function HeaderSearch({ initialKeyword }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [keyword, setKeyword] = useState(initialKeyword);

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) {
      // 검색 결과 화면에서 빈 값으로 검색하면 검색 해제
      if (initialKeyword) navigate('/');
      return;
    }
    navigate(`/search?keyword=${encodeURIComponent(trimmed)}`);
  };

  const handleClear = () => {
    setKeyword('');
    if (initialKeyword) {
      navigate('/');
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <form className={styles.search} onSubmit={handleSearch} role="search">
      <button type="submit" className={styles.searchButton} aria-label="검색">
        <span className="material-symbols-outlined">search</span>
      </button>
      <input
        ref={inputRef}
        type="text"
        enterKeyHint="search"
        className={styles.searchInput}
        placeholder="식물 품종 또는 식물명 검색 (예: 몬스테라 알보, 필로덴드론)"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        aria-label="식물 검색"
      />
      {keyword && (
        <button type="button" className={styles.clearButton} onClick={handleClear} aria-label="검색어 지우기">
          <span className="material-symbols-outlined">close</span>
        </button>
      )}
    </form>
  );
}

function Header() {
  const { user, isLoggedIn, isInitializing, logout } = useAuth();
  const { purchasableCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 검색 결과 화면일 때만 검색창에 검색어를 채움
  const searchedKeyword = location.pathname === '/search' ? (searchParams.get('keyword') ?? '').trim() : '';

  const isSeller = user?.role === 'SELLER';
  const showMemberMenu = !isInitializing && isLoggedIn;
  const cartBadgeText = purchasableCount > 99 ? '99+' : String(purchasableCount);
  const { unreadCount } = useNotification();
  const notificationBadgeText = unreadCount > 99 ? '99+' : String(unreadCount);

  const { balance: depositBalance } = useWallet(); // null = 조회 실패 또는 로딩 중

  const handleLogout = async () => {
    await logout();
    const isAuthRequiredPage = AUTH_REQUIRED_PATHS.some((path) => location.pathname.startsWith(path));
    navigate(isAuthRequiredPage ? '/login' : '/', { replace: true });
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* 왼쪽: 로고 + 예치금 */}
        <div className={styles.left}>
          <Link to="/" className={styles.logo}>
            <img src="/favicon.svg" alt="" className={styles.logoIcon} />
            replant
          </Link>

          {showMemberMenu && (
            <div className={styles.wallet}>
              <Link to="/wallet" className={styles.walletLink} aria-label="예치금 거래 내역 보기">
                <span className={`material-symbols-outlined ${styles.walletIcon}`}>
                  account_balance_wallet
                </span>
                <span className={styles.walletAmount}>{depositBalance === null ? '-' : formatPrice(depositBalance)}</span>
              </Link>
              <Link to="/deposit/charge" className={styles.chargeLink}>
                충전
              </Link>
            </div>
          )}
        </div>

        {/* 가운데: 검색창 */}
        <HeaderSearch key={searchedKeyword} initialKeyword={searchedKeyword} />

        {/* 오른쪽 */}
        {!isInitializing && (
          <nav className={styles.nav}>
            {isLoggedIn ? (
              <>
                <Link
                  to="/cart"
                  className={styles.iconButton}
                  aria-label={
                    purchasableCount > 0 ? `장바구니, 담은 상품 ${purchasableCount}개` : '장바구니'
                  }
                >
                  <span className="material-symbols-outlined">shopping_cart</span>
                  {purchasableCount > 0 && (
                    <span className={styles.badge} aria-hidden="true">
                      {cartBadgeText}
                    </span>
                  )}
                </Link>

                <Link
                  to="/notifications"
                  className={styles.iconButton}
                  aria-label={unreadCount > 0 ? `알림, 안 읽은 알림 ${unreadCount}개` : '알림'}
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {unreadCount > 0 && (
                    <span className={styles.badge} aria-hidden="true">
                      {notificationBadgeText}
                    </span>
                  )}
                </Link>

                {isSeller ? (
                  <Link to="/products/new" className={styles.primaryButton}>
                    <span className="material-symbols-outlined">add_circle</span>
                    식물 판매하기
                  </Link>
                ) : (
                  <Link to="/seller/register" className={styles.primaryButton}>
                    <span className="material-symbols-outlined">storefront</span>
                    판매자 등록하기
                  </Link>
                )}

                <Link to="/mypage" className={styles.nickname}>
                  {user.nickname}님
                </Link>
                <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.navLink}>
                  로그인
                </Link>
                <Link to="/signup" className={styles.primaryButton}>
                  회원가입
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
