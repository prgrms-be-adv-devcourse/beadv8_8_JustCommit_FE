import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import AccountLayout from './AccountLayout';

// 로그인 확인 + 내 정보 로딩 · 실패 표시 (회원 정보 수정 화면 공통)
// children: 내 정보가 준비되면 그릴 화면
function AccountGuard({ active, myInfo, loadError, children }) {
  const { isLoggedIn, isInitializing } = useAuth();
  const { pathname } = useLocation();

  if (isInitializing) return <main className="flex-1" />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: pathname }} />;
  if (loadError || !myInfo) {
    return (
      <AccountLayout active={active} wide={active === 'addresses'}>
        <p className="text-sm text-[#6b7280]" role={loadError ? 'alert' : undefined}>
          {loadError || '불러오는 중...'}
        </p>
      </AccountLayout>
    );
  }
  return children;
}

export default AccountGuard;
