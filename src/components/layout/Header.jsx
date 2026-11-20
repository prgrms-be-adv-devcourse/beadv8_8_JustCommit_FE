import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import useNotification from '../../hooks/useNotification';
import useWallet from '../../hooks/useWallet';
import CountBadge from '../common/CountBadge';
import logo from '../../assets/logo.webp';

// 시안: 캔버스 「replant 웹 시안」 01-2-1 공통 헤더 (비로그인 · 일반 회원 · 판매자)

// 로그인해야 볼 수 있는 페이지 (여기서 로그아웃하면 로그인 화면으로 이동)
const AUTH_REQUIRED_PATHS = ['/mypage', '/seller/register'];

// 검색창: 입력값은 initialKeyword로 시작 (Header가 URL 검색어를 key로 넘겨서, 검색어가 바뀌면 새로 만들어짐)
function HeaderSearch({ initialKeyword }) {
  const navigate = useNavigate();
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

  return (
    <div className="flex-1 max-w-[480px] mx-4">
      <form
        role="search"
        onSubmit={handleSearch}
        className="relative w-full h-9 flex items-center rounded-lg transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1b4332]/30 border border-gray-200 bg-white"
        style={{ backgroundColor: 'rgb(255, 255, 255)' }}
      >
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none flex items-center justify-center">
          <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" x2="16.65" y1="21" y2="16.65" />
          </svg>
        </span>
        <input
          className="w-full h-9 pl-9 pr-4 bg-transparent border-0 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all"
          data-purpose="header-search-input"
          placeholder="식물 품종 또는 식물명 검색 (예: 몬스테라 알보, 필로덴드론)"
          type="text"
          enterKeyHint="search"
          aria-label="식물 검색"
          style={{ backgroundColor: 'transparent' }}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </form>
    </div>
  );
}

function Header() {
  const { user, isLoggedIn, isInitializing, logout } = useAuth();
  const { purchasableCount } = useCart();
  const { unreadCount } = useNotification();
  const { balance } = useWallet(); // null = 조회 실패 또는 로딩 중
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 검색 결과 화면일 때만 검색창에 검색어를 채움
  const searchedKeyword = location.pathname === '/search' ? (searchParams.get('keyword') ?? '').trim() : '';
  const isSeller = user?.role === 'SELLER';

  const handleLogout = async () => {
    await logout();
    const isAuthRequiredPage = AUTH_REQUIRED_PATHS.some((path) => location.pathname.startsWith(path));
    navigate(isAuthRequiredPage ? '/login' : '/', { replace: true });
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-[1240px] mx-auto px-5 h-[84px] flex items-center justify-between gap-6">
        {/* 로고 */}
        <div className="flex items-center shrink-0">
          <Link aria-label="replant 홈" className="flex items-center gap-2 group h-9" to="/">
            <img
              src={logo}
              alt="replant 로고"
              className="w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              style={{ height: '30px', maxWidth: 'none' }}
            />
          </Link>
        </div>

        {/* 가운데: 검색창 */}
        <HeaderSearch key={searchedKeyword} initialKeyword={searchedKeyword} />

        {/* 오른쪽: 로그인 확인 중에는 비워 둠 */}
        {!isInitializing &&
          (isLoggedIn ? (
            <div className="flex items-center gap-4 shrink-0">
              {/* 예치금 */}
              <div
                className="h-9 flex items-center px-3 py-1 rounded-lg text-xs text-gray-800 font-medium select-none border border-gray-200 bg-white"
                style={{ backgroundColor: 'rgb(255, 255, 255)' }}
              >
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 text-[#1b4332] shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect height="16" rx="2" width="20" x="2" y="4" />
                    <path d="M7 15h0M2 10h20" />
                  </svg>
                  <Link to="/wallet" className="font-bold text-gray-900 text-[13px]" aria-label="예치금 거래 내역 보기">
                    {typeof balance !== 'number' ? '-' : `${balance.toLocaleString('ko-KR')}원`}
                  </Link>
                  <button
                    type="button"
                    className="text-xs font-bold text-[#1b4332] hover:underline cursor-pointer ml-1 transition-colors"
                    onClick={() => navigate('/deposit/charge')}
                  >
                    충전
                  </button>
                </div>
              </div>

              {/* 장바구니 */}
              <Link
                aria-label={purchasableCount > 0 ? `장바구니, 담은 상품 ${purchasableCount}개` : '장바구니'}
                className="relative flex items-center justify-center text-gray-900 hover:text-[#1b4332] p-1.5 transition-colors bg-transparent"
                to="/cart"
                title="장바구니"
              >
                <svg className="w-[28px] h-[28px] stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                  <path
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <CountBadge count={purchasableCount} />
              </Link>

              {/* 알림 */}
              <Link
                aria-label={unreadCount > 0 ? `알림, 안 읽은 알림 ${unreadCount}개` : '알림'}
                className="relative flex items-center justify-center text-gray-900 hover:text-[#1b4332] p-1.5 transition-colors bg-transparent"
                to="/notifications"
                title="알림"
              >
                <svg className="w-[28px] h-[28px] stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                  <path
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <CountBadge count={unreadCount} />
              </Link>

              {/* 닉네임 · 로그아웃 */}
              <div className="flex items-center gap-2.5 pl-1 select-none">
                <Link
                  to="/mypage"
                  className="font-semibold text-[15px] text-gray-900 underline underline-offset-4 decoration-gray-400 cursor-pointer hover:text-replant-forest transition-colors"
                >
                  {`${user.nickname}님`}
                </Link>
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-800 cursor-pointer transition-colors"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </div>

              {/* 판매자: 식물 판매하기 · 일반 회원: 판매자 등록하기 */}
              <button
                className="h-9 flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#1b4332] hover:bg-[#143427] text-white font-medium text-xs rounded-[4px] transition-colors shadow-xs"
                type="button"
                style={{ backgroundColor: 'rgb(15, 76, 58)' }}
                onClick={() => navigate(isSeller ? '/products/new' : '/seller/register')}
              >
                <span className="text-sm font-normal leading-none">+</span>
                <span>{isSeller ? '식물 판매하기' : '판매자 등록하기'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                className="h-9 flex items-center justify-center px-4 bg-white border border-[#d1d5db] hover:bg-gray-50 text-gray-800 font-medium text-xs rounded-none transition-colors"
                type="button"
                onClick={() => navigate('/login')}
              >
                로그인
              </button>
              <button
                className="h-9 flex items-center justify-center px-4 bg-[#0f4c3a] hover:bg-[#0a382a] text-white font-medium text-xs rounded-none transition-colors shadow-xs"
                type="button"
                onClick={() => navigate('/signup')}
              >
                회원가입
              </button>
            </div>
          ))}
      </div>
    </header>
  );
}

export default Header;
