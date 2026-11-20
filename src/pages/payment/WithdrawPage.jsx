import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { requestCashOut } from '../../api/walletApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import { formatBankAccount } from '../../constants/banks';
import useMyInfo from '../member/account/useMyInfo';
import { formatPrice } from '../../utils/format';
import { parseAmount } from './chargeUtils';
import WithdrawView from './WithdrawView';

const MAX_DIGITS = 9;
// 받는 계좌는 내 정보(GET /api/v1/users/me)의 account. 불러오기 전 · 실패 · 미등록이면 자리 문구
const ACCOUNT_PLACEHOLDER = '{은행} ***{계좌 끝 4자리} · 예금주 {예금주}';

// 시안 07-4-1 인출 · 07-4-2 금액 초과 (인출 가능 금액 = 판매 정산금만, 충전금은 인출 안 됨)
function WithdrawPage() {
  usePageTitle('예치금 인출');
  const navigate = useNavigate();
  const { isLoggedIn, isInitializing } = useAuth();
  const { balance, chargeBalance, withdrawableBalance, refreshWallet } = useWallet();
  const { myInfo } = useMyInfo();

  const [amount, setAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // 인출 신청 Idempotency-Key: 같은 금액으로 다시 누르면(503 계좌 조회 실패 · 응답 끊김 후 재시도) 같은 키를 써서 두 번 빠지지 않게 함
  const idempotencyRef = useRef(null);

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
      if (idempotencyRef.current?.amount !== amount) {
        idempotencyRef.current = { amount, key: crypto.randomUUID() };
      }
      await requestCashOut(amount, idempotencyRef.current.key);
      idempotencyRef.current = null;
      refreshWallet().catch(() => {});
      navigate('/wallet/withdrawals', { replace: true });
    } catch (error) {
      // 같은 키로 다른 요청이 이미 처리됨 → 다음 신청은 새 키로
      if (error.response?.data?.code === 'IDEMPOTENCY_KEY_CONFLICT') idempotencyRef.current = null;
      // 한도 초과 등은 화면 잔액이 서버와 다를 수 있어 다시 맞춤
      refreshWallet().catch(() => {});
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
      account={myInfo?.account ? formatBankAccount(myInfo.account) : ACCOUNT_PLACEHOLDER}
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
