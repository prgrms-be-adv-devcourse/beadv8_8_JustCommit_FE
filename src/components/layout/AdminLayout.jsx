import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { getManualImageReviews } from '../../api/adminApi';
import AdminHeader from './AdminHeader';
import Footer from './Footer';

// 관리자 화면 틀 (시안 09: 관리자 헤더 + 화면 + 공통 푸터)
// 헤더의 검수 대기 수 = 관리자 확인 대기 목록(GET /api/v1/admin/imageReviews?status=MANUAL)의 totalElements
// 검수를 처리하고 목록으로 돌아오면 다시 셈. 실패하면 헤더 기본 자리 문구
function AdminLayout() {
  const { pathname } = useLocation();
  const [pendingReviewCount, setPendingReviewCount] = useState(undefined);

  useEffect(() => {
    let ignore = false;
    getManualImageReviews({ size: 1 })
      .then((response) => {
        const total = response.data.data?.totalElements;
        if (!ignore && typeof total === 'number') setPendingReviewCount(total);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [pathname]);

  return (
    <div className="bg-white text-[#111827] min-h-screen flex flex-col antialiased">
      <AdminHeader pendingReviewCount={pendingReviewCount} />
      <Outlet />
      <Footer />
    </div>
  );
}

export default AdminLayout;
