import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import ComingSoonPage from './pages/ComingSoonPage';
import LoginPage from './pages/member/LoginPage';
import SignupPage from './pages/member/SignupPage';
import SellerRegisterPage from './pages/member/SellerRegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout 밖: 헤더·푸터 없는 페이지 */}
        <Route path="/login" element={<LoginPage />} />

        {/* Layout 안: 헤더·푸터 있는 페이지 */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* 헤더 메뉴 (TODO: 각 기능 구현 시 실제 페이지로 교체) */}
          <Route path="/search" element={<ComingSoonPage title="검색 결과" />} />
          <Route path="/mypage" element={<ComingSoonPage title="마이페이지" />} />
          <Route path="/cart" element={<ComingSoonPage title="장바구니" />} />
          <Route path="/notifications" element={<ComingSoonPage title="알림" />} />
          <Route path="/deposit/charge" element={<ComingSoonPage title="예치금 충전" />} />
          <Route path="/products/new" element={<ComingSoonPage title="식물 판매하기" />} />
          <Route path="/products/:productId" element={<ComingSoonPage title="상품 상세" />} />
          <Route path="/seller/register" element={<SellerRegisterPage />} />

          {/* 정책 페이지 */}
          <Route path="/terms" element={<ComingSoonPage title="이용약관" />} />
          <Route path="/privacy" element={<ComingSoonPage title="개인정보처리방침" />} />
          <Route path="/safety-policy" element={<ComingSoonPage title="안전 보증 정책" />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
