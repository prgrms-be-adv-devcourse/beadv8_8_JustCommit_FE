import { BrowserRouter, Routes, Route } from 'react-router-dom';
import OAuthCallbackPage from './pages/member/OAuthCallbackPage';
import SocialSignupPage from './pages/member/SocialSignupPage';
import ProductDetailPage from './pages/product/ProductDetailPage';
import ProductCreatePage from './pages/product/ProductCreatePage';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import ComingSoonPage from './pages/ComingSoonPage';
import LoginPage from './pages/member/LoginPage';
import SignupPage from './pages/member/SignupPage';
import SellerRegisterPage from './pages/member/SellerRegisterPage';
import MyPage from './pages/member/MyPage';
import MyInfoPage from './pages/member/mypage/MyInfoPage';
import AddressPage from './pages/member/mypage/AddressPage';
import CartPage from './pages/market/CartPage';
import CheckoutPage from './pages/market/CheckoutPage';
import OrderCompletePage from './pages/market/OrderCompletePage';
import OrderExpiredPage from './pages/market/OrderExpiredPage';
import OrderFailPage from './pages/market/OrderFailPage';
import MyProductsPage from './pages/product/MyProductsPage';
import SalesOrdersPage from './pages/market/SalesOrdersPage';
import SalesOrderDetailPage from './pages/market/SalesOrderDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout 밖: 헤더·푸터 없는 페이지 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        {/* Layout 안: 헤더·푸터 있는 페이지 */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          {/* 검색 결과: 메인 목록에 ?keyword= 를 적용해서 보여줌 */}
          <Route path="/search" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/social" element={<SocialSignupPage />} />

          {/* 헤더 메뉴 (TODO: 각 기능 구현 시 실제 페이지로 교체) */}
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/info" element={<MyInfoPage />} />
          <Route path="/mypage/addresses" element={<AddressPage />} />
          <Route path="/mypage/products" element={<MyProductsPage />} />
          <Route path="/orders" element={<ComingSoonPage title="주문 내역" />} />
          <Route path="/orders/seller" element={<SalesOrdersPage />} />
          <Route path="/orders/seller/:sellerOrderId" element={<SalesOrderDetailPage />} />
          <Route path="/wallet" element={<ComingSoonPage title="예치금" />} />
          <Route path="/settlements" element={<ComingSoonPage title="정산" />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/notifications" element={<ComingSoonPage title="알림" />} />
          <Route path="/deposit/charge" element={<ComingSoonPage title="예치금 충전" />} />
          <Route path="/products/new" element={<ProductCreatePage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/products/:productId/edit" element={<ProductCreatePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/fail" element={<OrderFailPage />} />
          <Route path="/orders/:orderId" element={<ComingSoonPage title="주문 상세" />} />
          <Route path="/orders/:orderId/complete" element={<OrderCompletePage />} />
          <Route path="/orders/:orderId/expired" element={<OrderExpiredPage />} />
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
