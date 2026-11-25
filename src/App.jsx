import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import RequireAdmin from './components/admin/RequireAdmin';
import ErrorPage from './components/common/ErrorPage';
import ComingSoonPage from './pages/ComingSoonPage';
// 02 탐색 · 상품
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/product/ProductDetailPage';
import SellerShopPage from './pages/member/SellerShopPage';
import SellerReviewsPage from './pages/member/SellerReviewsPage';
import SemanticSearchPage from './pages/ai/SemanticSearchPage';
// 03 구매 · 주문
import CartPage from './pages/market/CartPage';
import CheckoutPage from './pages/market/CheckoutPage';
import OrderFailPage from './pages/market/OrderFailPage';
import OrderListPage from './pages/market/OrderListPage';
import OrderCompletePage from './pages/market/OrderCompletePage';
import OrderExpiredPage from './pages/market/OrderExpiredPage';
// 03-5 주문 상세 · 04 취소 · 반품
import OrderDetailPage from './pages/market/OrderDetailPage';
import RefundRequestPage from './pages/market/RefundRequestPage';
// 05 리뷰
import ReviewWritePage from './pages/market/review/ReviewWritePage';
import ReviewDonePage from './pages/market/review/ReviewDonePage';
import MyReviewsPage from './pages/market/review/MyReviewsPage';
// 06 회원: 로그인 · 가입
import OAuthCallbackPage from './pages/member/OAuthCallbackPage';
import LoginPage from './pages/member/LoginPage';
import ResetPasswordPage from './pages/member/find/ResetPasswordPage';
import SignupPage from './pages/member/SignupPage';
import SocialSignupPage from './pages/member/SocialSignupPage';
// 06 마이페이지 · 회원 정보 수정 · 알림
import MyPage from './pages/member/MyPage';
import NicknamePage from './pages/member/account/NicknamePage';
import IntroPage from './pages/member/account/IntroPage';
import PasswordPage from './pages/member/account/PasswordPage';
import BankAccountPage from './pages/member/account/BankAccountPage';
import AddressesPage from './pages/member/account/AddressesPage';
import AccountWithdrawPage from './pages/member/account/WithdrawPage';
import NotificationPage from './pages/notification/NotificationPage';
// 07 예치금
import WalletPage from './pages/payment/WalletPage';
import ChargePage from './pages/payment/ChargePage';
import ChargeSuccessPage from './pages/payment/ChargeSuccessPage';
import ChargeFailPage from './pages/payment/ChargeFailPage';
import ChargeHistoryPage from './pages/payment/ChargeHistoryPage';
import WithdrawPage from './pages/payment/WithdrawPage';
import WithdrawHistoryPage from './pages/payment/WithdrawHistoryPage';
// 08 판매자
import SellerRegisterPage from './pages/member/SellerRegisterPage';
import ProductCreatePage from './pages/product/ProductCreatePage';
import ReviewResultPage from './pages/product/ReviewResultPage';
import MyProductsPage from './pages/product/MyProductsPage';
import SalesOrdersPage from './pages/market/SalesOrdersPage';
import SalesOrderDetailPage from './pages/market/SalesOrderDetailPage';
import SettlementPage from './pages/settlement/SettlementPage';
import SettlementReportPage from './pages/settlement/SettlementReportPage';
// 09 관리자
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminReviewDetailPage from './pages/admin/AdminReviewDetailPage';
import AdminFeeReportPage from './pages/admin/AdminFeeReportPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout 밖: 카카오 로그인 콜백 */}
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        {/* 웹 시안으로 다시 만든 화면 (헤더 · 푸터 모두 보임) */}
        <Route element={<Layout designed />}>
          {/* 준비 중 화면 (시안 01-2-3): 정책 페이지 */}
          <Route path="/terms" element={<ComingSoonPage title="이용약관" />} />
          <Route path="/privacy" element={<ComingSoonPage title="개인정보처리방침" />} />
          <Route path="/safety-policy" element={<ComingSoonPage title="안전 보증 정책" />} />

          {/* 02 탐색 · 상품. 검색 결과는 메인 목록에 ?keyword= 를 적용해서 보여줌 */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<HomePage />} />
          {/* 문장으로 찾기 (ai 품종 의미 검색) */}
          <Route path="/search/semantic" element={<SemanticSearchPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/sellers/:sellerId" element={<SellerShopPage />} />
          <Route path="/sellers/:sellerId/reviews" element={<SellerReviewsPage />} />

          {/* 03 구매 · 주문 */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/fail" element={<OrderFailPage />} />
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/:orderId/complete" element={<OrderCompletePage />} />
          <Route path="/orders/:orderId/expired" element={<OrderExpiredPage />} />

          {/* 03-5 주문 상세 · 04 취소 · 반품 */}
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/orders/:orderId/items/:orderItemId/return" element={<RefundRequestPage />} />

          {/* 05 리뷰: 작성 (05-2-1 · 05-2-2) · 등록 완료 (05-2-3) */}
          <Route path="/orders/:orderId/review" element={<ReviewWritePage />} />
          <Route path="/orders/:orderId/review/done" element={<ReviewDonePage />} />
          {/* 05 리뷰 관리 (05-3): 내가 쓴 리뷰 · 쓸 수 있는 리뷰 · 받은 리뷰(판매자) */}
          <Route path="/mypage/reviews" element={<MyReviewsPage />} />

          {/* 06 회원: 로그인 · 비밀번호 재설정 · 회원가입 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/social" element={<SocialSignupPage />} />

          {/* 06 마이페이지 · 회원 정보 수정 · 알림 */}
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/account" element={<NicknamePage />} />
          <Route path="/mypage/account/intro" element={<IntroPage />} />
          <Route path="/mypage/account/password" element={<PasswordPage />} />
          <Route path="/mypage/account/bank" element={<BankAccountPage />} />
          <Route path="/mypage/addresses" element={<AddressesPage />} />
          <Route path="/mypage/account/withdraw" element={<AccountWithdrawPage />} />
          <Route path="/notifications" element={<NotificationPage />} />

          {/* 07 예치금 */}
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/wallet/charges" element={<ChargeHistoryPage />} />
          <Route path="/wallet/withdraw" element={<WithdrawPage />} />
          <Route path="/wallet/withdrawals" element={<WithdrawHistoryPage />} />
          <Route path="/deposit/charge" element={<ChargePage />} />
          <Route path="/deposit/charge/success" element={<ChargeSuccessPage />} />
          <Route path="/deposit/charge/fail" element={<ChargeFailPage />} />

          {/* 08 판매자 · 04 판매 주문 상세 */}
          <Route path="/seller/register" element={<SellerRegisterPage />} />
          <Route path="/products/new" element={<ProductCreatePage />} />
          <Route path="/products/:productId/edit" element={<ProductCreatePage />} />
          <Route path="/products/:productId/review" element={<ReviewResultPage />} />
          <Route path="/mypage/products" element={<MyProductsPage />} />
          <Route path="/orders/seller" element={<SalesOrdersPage />} />
          <Route path="/orders/seller/:sellerOrderId" element={<SalesOrderDetailPage />} />
          <Route path="/settlements" element={<SettlementPage />} />
          <Route path="/settlements/report" element={<SettlementReportPage />} />

          {/* 404: 시안 01-1-5 오류 화면 */}
          <Route path="*" element={<ErrorPage type="NOT_FOUND" />} />
        </Route>

        {/* 09 관리자 (관리자가 아니면 403 오류 화면) */}
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            <Route path="/admin/reviews/:imageReviewId" element={<AdminReviewDetailPage />} />
            <Route path="/admin/reports/fees" element={<AdminFeeReportPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
