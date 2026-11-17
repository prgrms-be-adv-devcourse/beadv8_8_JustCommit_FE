import { BrowserRouter, Routes, Route } from 'react-router-dom';
import OAuthCallbackPage from './pages/member/OAuthCallbackPage';
import SocialSignupPage from './pages/member/SocialSignupPage';
import ProductDetailPage from './pages/product/ProductDetailPage';
import ProductCreatePage from './pages/product/ProductCreatePage';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ErrorPage from './components/common/ErrorPage';
import ComingSoonPage from './pages/ComingSoonPage';
import LoginPage from './pages/member/LoginPage';
import SignupPage from './pages/member/SignupPage';
import SellerRegisterPage from './pages/member/SellerRegisterPage';
import MyPage from './pages/member/MyPage';
import NicknamePage from './pages/member/account/NicknamePage';
import PasswordPage from './pages/member/account/PasswordPage';
import BankAccountPage from './pages/member/account/BankAccountPage';
import AddressesPage from './pages/member/account/AddressesPage';
import WithdrawPage from './pages/member/account/WithdrawPage';
import ReviewsPage from './pages/review/ReviewsPage';
import ReviewWritePage from './pages/review/ReviewWritePage';
import ReviewDonePage from './pages/review/ReviewDonePage';
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
import SalesOrdersPage from './pages/market/SalesOrdersPage';
import SalesOrderDetailPage from './pages/market/SalesOrderDetailPage';
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
          <Route path="/mypage/products" element={<MyProductsPage />} />
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/seller" element={<SalesOrdersPage />} />
          <Route path="/orders/seller/:sellerOrderId" element={<SalesOrderDetailPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/settlements" element={<SettlementPage title="정산" />} />
          <Route path="/cart" element={<CartPage />} />
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

        {/* 시안 06-4 마이페이지 · 06-5 회원 정보 수정 · 06-6 알림 · 05-2 리뷰 작성 · 05-3 리뷰 관리 */}
        <Route element={<Layout designed />}>
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/account" element={<NicknamePage />} />
          <Route path="/mypage/account/password" element={<PasswordPage />} />
          <Route path="/mypage/account/bank" element={<BankAccountPage />} />
          <Route path="/mypage/addresses" element={<AddressesPage />} />
          <Route path="/mypage/account/withdraw" element={<WithdrawPage />} />
          <Route path="/mypage/reviews" element={<ReviewsPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/orders/:orderId/review" element={<ReviewWritePage />} />
          <Route path="/orders/:orderId/review/done" element={<ReviewDonePage />} />
        </Route>

        {/* 404: 시안 01-1-5 오류 화면 (헤더 · 푸터 모두 보임) */}
        <Route element={<Layout designed />}>
          <Route path="*" element={<ErrorPage type="NOT_FOUND" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
