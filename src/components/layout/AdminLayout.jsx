import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import Footer from './Footer';

// 관리자 화면 틀 (시안 09: 관리자 헤더 + 화면 + 공통 푸터)
function AdminLayout() {
  return (
    <div className="bg-white text-[#111827] min-h-screen flex flex-col antialiased">
      <AdminHeader />
      <Outlet />
      <Footer />
    </div>
  );
}

export default AdminLayout;
