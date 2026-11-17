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
        const { amount: charged, balanceAfter } = response.data.data;
        const result = { amount: Number(charged), balanceAfter: Number(balanceAfter) };
        if (!marketOrderId) {
          finish(result);
          return;
        }
        // 주문서에서 온 충전: 충전이 끝나면 결제 대기 주문을 바로 결제
        try {
          await payOrder(marketOrderId);
          refreshWallet().catch(() => {});
          navigate(`/orders/${marketOrderId}/complete`, { replace: true });
        } catch (error) {
          finish({ ...result, orderError: error.response?.data?.message ?? ORDER_PAY_FAILED });
        }
      })
      .catch((error) => {
        setErrorMessage(error.response?.data?.message ?? '충전을 마무리하지 못했어요.');
      });
  }, [isLoggedIn, savedResult, hasParams, chargeId, paymentKey, pgOrderNo, amount, marketOrderId, navigate, refreshWallet]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

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
