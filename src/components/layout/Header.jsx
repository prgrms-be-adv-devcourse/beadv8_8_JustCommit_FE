import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import styles from './Header.module.css';

function Header() {
  const { user, isLoggedIn, isInitializing, logout } = useAuth();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const isSeller = user?.role === 'SELLER';

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;
    navigate(`/search?keyword=${encodeURIComponent(trimmed)}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <img src="/favicon.svg" alt="" className={styles.logoIcon} />
          replant
        </Link>

        <form className={styles.search} onSubmit={handleSearch} role="search">
          <input
            type="text"
            className={styles.searchInput}
            placeholder="식물 품종 또는 식물명 검색 (예: 몬스테라 알보, 필로덴드론)"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            aria-label="식물 검색"
          />
          <button type="submit" className={styles.searchButton} aria-label="검색">
            <span className="material-symbols-outlined">search</span>
          </button>
        </form>

        {!isInitializing && (
          <nav className={styles.nav}>
            {isLoggedIn ? (
              <>
                <div className={styles.wallet}>
                  <span className={`material-symbols-outlined ${styles.walletIcon}`}>
                    account_balance_wallet
                  </span>
                  {/* TODO: 결제 모듈 예치금 조회 API 연결 */}
                  <span className={styles.walletAmount}>-원</span>
                  <Link to="/deposit/charge" className={styles.chargeLink}>
                    충전
                  </Link>
                </div>

                <Link to="/cart" className={styles.iconButton} aria-label="장바구니">
                  <span className="material-symbols-outlined">shopping_bag</span>
                </Link>

                <Link to="/notifications" className={styles.iconButton} aria-label="알림">
                  <span className="material-symbols-outlined">notifications</span>
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
