import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import ErrorPage from '../common/ErrorPage';

// 관리자 화면 입구: 로그인 안 했으면 로그인으로, 관리자가 아니면 403 오류 화면 (일반 헤더 · 푸터)
function RequireAdmin() {
  const { user, isLoggedIn, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) return null;
  if (!isLoggedIn) {
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  }
  if (user.role !== 'ADMIN') {
    return (
      <div className="bg-white text-[#111827] min-h-screen flex flex-col antialiased">
        <Header />
        <ErrorPage type="FORBIDDEN" />
        <Footer />
      </div>
    );
  }
  return <Outlet />;
}

export default RequireAdmin;
