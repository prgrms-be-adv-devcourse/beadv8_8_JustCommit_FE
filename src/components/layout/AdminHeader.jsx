import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useNotification from '../../hooks/useNotification';
import CountBadge from '../common/CountBadge';
import logo from '../../assets/logo.webp';

// 시안: 캔버스 「replant 웹 시안」 09 관리자 헤더 (AdminHeader)
// 알림 종 · 안 읽은 수 배지는 일반 Header와 같은 알림 컨텍스트 · 경로(/notifications)를 씀

// pendingReviewCount: 사진 검수 대기 수. 관리자 API가 아직 없어 기본값 자리 문구를 보여 줌
function AdminHeader({ pendingReviewCount = '{검수 대기 수}' }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();

  const handleLogout = async (event) => {
    event.preventDefault();
    await logout();
    navigate('/login', { replace: true });
  };

  const tabClass = ({ isActive }) =>
    `h-[72px] px-1 flex items-center gap-1.5 border-b-2 text-[15px] ${
      isActive ? 'border-[#0f4c3a] text-[#0f4c3a] font-bold' : 'border-transparent text-[#4b5563] font-medium'
    }`;

  return (
    <header className="w-full bg-white border-b border-[#e5e7eb]">
      <div className="max-w-[1240px] mx-auto px-5 h-[72px] flex items-center gap-8">
        <Link to="/admin/reviews" className="h-[71px] flex items-center gap-2 shrink-0 overflow-hidden">
          <img
            src={logo}
            alt="replant 로고"
            className="w-auto object-contain"
            style={{ height: '27.5px', maxWidth: 'none' }}
          />
          <span className="h-6 px-2 flex items-center bg-[#0f4c3a] text-white text-xs font-bold">관리자</span>
        </Link>
        <nav className="flex items-center gap-6">
          <NavLink to="/admin/reviews" className={tabClass}>
            {({ isActive }) => (
              <>
                사진 검수
                <span
                  className={`min-w-[22px] h-[22px] px-1.5 flex items-center justify-center text-xs font-semibold ${
                    isActive ? 'bg-[#0f4c3a] text-white' : 'bg-[#f3f4f6] text-[#4b5563]'
                  }`}
                >
                  {pendingReviewCount}
                </span>
              </>
            )}
          </NavLink>
          <NavLink to="/admin/reports/fees" className={tabClass}>
            수수료 · 배송비 리포트
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <Link
            aria-label={unreadCount > 0 ? `알림, 안 읽은 알림 ${unreadCount}개` : '알림'}
            className="relative flex items-center justify-center text-[#111827] p-1.5"
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
          <span className="text-[#4b5563]">{user?.nickname ?? '{관리자 이름}'}</span>
          <a href="/login" onClick={handleLogout} className="flex items-center gap-1 text-[#4b5563] underline">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            로그아웃
          </a>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
