import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { requestCashOut } from '../../api/walletApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import { formatPrice } from '../../utils/format';
import { parseAmount } from './chargeUtils';
import WithdrawView from './WithdrawView';

const MAX_DIGITS = 9;
// TODO: 받는 계좌 조회 API(member 계좌)가 생기면 "{은행} ***{끝 4자리} · 예금주 {마스킹 이름}"으로 채움
const ACCOUNT_PLACEHOLDER = '{은행} ***{계좌 끝 4자리} · 예금주 {예금주}';

// 시안 07-4-1 인출 · 07-4-2 금액 초과 (인출 가능 금액 = 판매 정산금만, 충전금은 인출 안 됨)
function WithdrawPage() {
  usePageTitle('예치금 인출');
  const navigate = useNavigate();
  const { isLoggedIn, isInitializing } = useAuth();
  const { balance, chargeBalance, withdrawableBalance, refreshWallet } = useWallet();

  const [amount, setAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isLoggedIn) refreshWallet().catch(() => {});
  }, [isLoggedIn, refreshWallet]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/wallet/withdraw' }} />;

  const hasWithdrawable = typeof withdrawableBalance === 'number';
  const isOver = hasWithdrawable && amount > withdrawableBalance;
  const canSubmit = amount > 0 && !isOver && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await requestCashOut(amount);
      refreshWallet().catch(() => {});
      navigate('/wallet/withdrawals', { replace: true });
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? '인출을 신청하지 못했어요. 잠시 후 다시 시도해 주세요.');
      setIsSubmitting(false);
    }
  };

  let submitLabel = '인출 신청';
  if (isSubmitting) submitLabel = '신청하는 중...';
  else if (canSubmit) submitLabel = `${formatPrice(amount)} 인출 신청`;

  return (
    <WithdrawView
      balance={balance === null ? null : Number(balance)}
      chargeBalance={chargeBalance ?? '{충전금}'}
      withdrawableBalance={withdrawableBalance ?? '{인출 가능 금액}'}
      account={ACCOUNT_PLACEHOLDER}
      amount={amount}
      onAmountChange={(text) => setAmount(parseAmount(text, MAX_DIGITS))}
      onAll={() => hasWithdrawable && setAmount(withdrawableBalance)}
      isOver={isOver}
      canSubmit={canSubmit}
      onSubmit={handleSubmit}
      submitLabel={submitLabel}
      disabled={isSubmitting}
      errorMessage={errorMessage}
    />
  );
}

export default WithdrawPage;
