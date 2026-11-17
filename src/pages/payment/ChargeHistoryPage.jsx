import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { cancelCharge } from '../../api/walletApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import ChargeHistoryView from './ChargeHistoryView';

// TODO: 충전 내역 API(walletApi.getCharges)가 생기면 이 자리 문구 대신 응답으로 그림
// 응답 → 화면: approvedAt은 formatDateTime으로 "2026.10.15 14:20", 금액은 숫자 그대로
const PLACEHOLDER = {
  cancelableTotal: '{취소할 수 있는 충전금}',
  charges: [
    {
      chargeId: 'placeholder',
      approvedAt: '{충전일시}',
      amount: '{충전 금액}',
      cancelledAmount: 0,
      cancelableAmount: '{취소되는 금액}',
      status: 'APPROVED',
    },
  ],
};

// 이미 사용한 금액 = 충전 금액 − 지금까지 취소한 금액 − 이번에 취소되는 금액
function usedAmountOf(charge) {
  if (typeof charge.amount !== 'number' || typeof charge.cancelableAmount !== 'number') return '{이미 사용한 금액}';
  return charge.amount - charge.cancelledAmount - charge.cancelableAmount;
}

// 시안 07-3 충전 내역 · 충전 취소 (부분 취소 가능: 금액은 서버가 min(남은 취소 가능 금액, 지금 충전금)으로 정함)
function ChargeHistoryPage() {
  usePageTitle('충전 내역');
  const { isLoggedIn, isInitializing } = useAuth();
  const { refreshWallet } = useWallet();

  const [data] = useState(PLACEHOLDER);
  const [confirmCharge, setConfirmCharge] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [doneResult, setDoneResult] = useState(null);

  useEffect(() => {
    if (isLoggedIn) refreshWallet().catch(() => {});
  }, [isLoggedIn, refreshWallet]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/wallet/charges' }} />;

  const closeConfirm = () => {
    if (isCancelling) return;
    setConfirmCharge(null);
    setCancelError('');
  };

  const handleConfirm = async () => {
    setIsCancelling(true);
    setCancelError('');
    try {
      const response = await cancelCharge(confirmCharge.chargeId);
      const result = response.data.data;
      const wallet = await refreshWallet().catch(() => null);
      setConfirmCharge(null);
      setDoneResult({
        usedAmount: Number(result.usedAmount ?? usedAmountOf(confirmCharge)),
        cancelAmount: Number(result.cancelledAmount),
        balanceAfter: Number(result.balanceAfter ?? wallet?.balance),
      });
      // TODO: 충전 내역 API가 생기면 여기서 목록을 다시 불러옴
    } catch (error) {
      setCancelError(error.response?.data?.message ?? '충전을 취소하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <ChargeHistoryView
      cancelableTotal={data.cancelableTotal}
      charges={data.charges}
      onCancelClick={(charge) => setConfirmCharge(charge)}
      confirmTarget={
        confirmCharge && {
          amount: confirmCharge.amount,
          usedAmount: usedAmountOf(confirmCharge),
          cancelAmount: confirmCharge.cancelableAmount,
        }
      }
      onConfirm={handleConfirm}
      onCloseConfirm={closeConfirm}
      isCancelling={isCancelling}
      cancelError={cancelError}
      doneResult={doneResult}
      onCloseDone={() => setDoneResult(null)}
    />
  );
}

export default ChargeHistoryPage;
