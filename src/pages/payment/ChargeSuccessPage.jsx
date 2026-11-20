import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { payOrder } from '../../api/orderApi';
import { confirmCharge } from '../../api/walletApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import { ChargeFailView, ChargeProcessingView, ChargeSuccessView } from './ChargeResultView';

const ORDER_PAY_FAILED = '충전은 완료됐지만 주문을 결제하지 못했어요. 주문 내역에서 다시 확인해 주세요.';

// 토스 결제 성공 후 돌아오는 화면: 충전 승인 → (주문서에서 왔으면) 그 주문 자동 결제
function ChargeSuccessPage() {
  usePageTitle('충전 완료');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, isInitializing } = useAuth();
  const { refreshWallet } = useWallet();

  // 승인이 끝나면 결과만 화면 상태로 남김 → 새로고침해도 다시 승인하지 않음
  const savedResult = location.state?.chargeResult ?? null;

  // 토스가 성공 주소에 붙여 주는 값 + 결제창을 열 때 붙여 둔 chargeId · marketOrderId
  const chargeId = searchParams.get('chargeId');
  const paymentKey = searchParams.get('paymentKey');
  const pgOrderNo = searchParams.get('orderId'); // 토스 orderId = 우리 충전의 pgOrderNo
  const amount = searchParams.get('amount');
  const marketOrderId = searchParams.get('marketOrderId');
  const hasParams = Boolean(chargeId && paymentKey && pgOrderNo && amount);

  const [errorMessage, setErrorMessage] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    // 로그인 복구가 끝난 뒤 한 번만 승인 (개발 모드에서 effect가 두 번 실행돼도 한 번만 요청)
    if (!isLoggedIn || savedResult || !hasParams || startedRef.current) return;
    startedRef.current = true;

    const finish = (result) => {
      refreshWallet().catch(() => {});
      navigate('/deposit/charge/success', { replace: true, state: { chargeResult: result } });
    };

    confirmCharge(chargeId, { paymentKey, orderId: pgOrderNo, amount: Number(amount) })
      .then(async (response) => {
        const { status, amount: charged, balanceAfter } = response.data.data;
        // APPROVED가 아니면(결과 불명 · 반영 실패로 PENDING) 아직 적립 전 → 처리 중 화면, 자동 결제 안 함
        if (status !== 'APPROVED') {
          refreshWallet().catch(() => {});
          navigate('/deposit/charge/success', { replace: true, state: { chargeResult: { processing: true } } });
          return;
        }
        const result = { amount: Number(charged), balanceAfter: Number(balanceAfter) };
        if (!marketOrderId) {
          finish(result);
          return;
        }
        // 주문서에서 온 충전: 충전이 끝나면 결제 대기 주문을 바로 결제
        try {
          const payResponse = await payOrder(marketOrderId);
          const order = payResponse.data?.data ?? payResponse.data;
          // 200이어도 PAID가 아닐 수 있음 (잔액 부족 → PAYMENT_PENDING, 결과 불명 → PAYMENT_PROCESSING 등)
          if (order?.status !== 'PAID') {
            finish({ ...result, orderError: ORDER_PAY_FAILED });
            return;
          }
          refreshWallet().catch(() => {});
          navigate(`/orders/${marketOrderId}/complete`, { replace: true });
        } catch (error) {
          if (error.response?.data?.code === 'PAYMENT_WINDOW_EXPIRED') {
            refreshWallet().catch(() => {});
            navigate(`/orders/${marketOrderId}/expired`, { replace: true });
            return;
          }
          finish({ ...result, orderError: error.response?.data?.message ?? ORDER_PAY_FAILED });
        }
      })
      .catch((error) => {
        // 응답 없음(타임아웃 · 연결 끊김) · 이미 승인 처리 중(CHARGE_PROCESSING)은 실패가 아니라 결과를 아직 모르는 것
        // → 처리 중 화면 (복구 스케줄러가 토스 조회로 확정)
        const status = error.response?.status;
        const code = error.response?.data?.code;
        // 게이트웨이 시간 초과 · 연결 실패(502 · 503 · 504)도 승인이 이미 끝났을 수 있어 결과 불명으로 봄
        if (!error.response || code === 'CHARGE_PROCESSING' || status === 502 || status === 503 || status === 504) {
          navigate('/deposit/charge/success', { replace: true, state: { chargeResult: { processing: true } } });
          return;
        }
        setErrorMessage(error.response?.data?.message ?? '충전을 마무리하지 못했어요.');
      });
  }, [isLoggedIn, savedResult, hasParams, chargeId, paymentKey, pgOrderNo, amount, marketOrderId, navigate, refreshWallet]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (savedResult?.processing) return <ChargeProcessingView />;

  if (savedResult) {
    return (
      <ChargeSuccessView
        amount={savedResult.amount}
        balanceAfter={savedResult.balanceAfter}
        errorMessage={savedResult.orderError}
      />
    );
  }

  if (!hasParams || errorMessage) {
    const retryTo = marketOrderId ? `/deposit/charge?orderId=${encodeURIComponent(marketOrderId)}` : undefined;
    return <ChargeFailView retryTo={retryTo} />;
  }

  return <ChargeProcessingView />;
}

export default ChargeSuccessPage;
