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
import { EMPTY } from '../../constants/emptyText';

const MAX_DIGITS = 9;
// 받는 계좌는 내 정보(GET /api/v1/users/me)의 account. 불러오기 전 · 실패 · 미등록이면 「-」

// 중복 신청 방지 키: crypto.randomUUID는 HTTPS · localhost에서만 있어서 없으면 getRandomValues로 만듦
function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// 시안 07-4-1 인출 · 07-4-2 금액 초과 (예치금 잔액 하나, 인출 한도 = 잔액 전체)
function WithdrawPage() {
  usePageTitle('예치금 인출');
  const navigate = useNavigate();
  const { isLoggedIn, isInitializing } = useAuth();
  const { balance, refreshWallet } = useWallet();
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

  const balanceNumber = balance === null || balance === undefined ? null : Number(balance);
  const hasBalance = balanceNumber !== null && !Number.isNaN(balanceNumber);
  const isOver = hasBalance && amount > balanceNumber;
  const canSubmit = amount > 0 && !isOver && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (idempotencyRef.current?.amount !== amount) {
        idempotencyRef.current = { amount, key: createIdempotencyKey() };
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
      balance={hasBalance ? balanceNumber : null}
      account={myInfo?.account ? formatBankAccount(myInfo.account) : EMPTY}
      amount={amount}
      onAmountChange={(text) => setAmount(parseAmount(text, MAX_DIGITS))}
      onAll={() => hasBalance && setAmount(balanceNumber)}
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
