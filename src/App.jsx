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
import WalletPage from './pages/payment/WalletPage';
import ChargePage from './pages/payment/ChargePage';
import ChargeSuccessPage from './pages/payment/ChargeSuccessPage';
import ChargeFailPage from './pages/payment/ChargeFailPage';
import CheckoutPage from './pages/market/CheckoutPage';
import OrderCompletePage from './pages/market/OrderCompletePage';
import OrderExpiredPage from './pages/market/OrderExpiredPage';
import OrderFailPage from './pages/market/OrderFailPage';
import OrderListPage from './pages/market/OrderListPage';
import OrderDetailPage from './pages/market/OrderDetailPage';
import MyProductsPage from './pages/product/MyProductsPage';
import SettlementPage from './pages/settlement/SettlementPage';
import NotificationPage from './pages/notification/NotificationPage';


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
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/seller" element={<ComingSoonPage title="판매 주문" backTo="/mypage" />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/settlements" element={<SettlementPage title="정산" />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/deposit/charge" element={<ChargePage />} />
          <Route path="/deposit/charge/success" element={<ChargeSuccessPage />} />
          <Route path="/deposit/charge/fail" element={<ChargeFailPage />} />
          <Route path="/products/new" element={<ProductCreatePage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/products/:productId/edit" element={<ProductCreatePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/fail" element={<OrderFailPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/orders/:orderId/complete" element={<OrderCompletePage />} />
          <Route path="/orders/:orderId/expired" element={<OrderExpiredPage />} />
          <Route path="/seller/register" element={<SellerRegisterPage />} />

          {/* 정책 페이지 */}
          <Route path="/terms" element={<ComingSoonPage title="이용약관" />} />
          <Route path="/privacy" element={<ComingSoonPage title="개인정보처리방침" />} />
          <Route path="/safety-policy" element={<ComingSoonPage title="안전 보증 정책" />} />
        </Route>

        {/* 404: 헤더는 보이고 푸터는 숨김 */}
        <Route element={<Layout hideFooter />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
