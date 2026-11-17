import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { withdraw } from '../../../api/memberApi';
import { ACTION_ERROR } from '../../../constants/actionError';
import useAuth from '../../../hooks/useAuth';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatPrice } from '../../../utils/format';
import WithdrawView from './WithdrawView';

// 탈퇴가 막힌 이유 → 모달 줄 (값이 0이면 그 줄은 안 보임)
// TODO: 응답 필드 이름은 백엔드 탈퇴 API가 정해지면 맞춥니다 (BE docs/flows/signup-and-replica.md#탈퇴)
function toBlockers(data = {}) {
  return [
    { value: data.pendingOrderCount, label: '구매 확정 전인 주문', unit: '건', linkLabel: '주문 내역 보기', to: '/orders' },
    {
      value: data.pendingSellerOrderCount,
      label: '판매자 수락을 기다리는 판매 주문',
      unit: '건',
      linkLabel: '판매 주문 보기',
      to: '/orders/seller',
    },
    { value: data.walletBalance, label: '예치금 잔액', unit: 'won', linkLabel: '예치금 정리하기', to: '/wallet' },
    { value: data.unpaidSettlementAmount, label: '지급 전 정산', unit: 'won', linkLabel: '정산 리포트 보기', to: '/settlements' },
  ]
    .filter((row) => row.value > 0)
    .map((row) => ({ ...row, valueText: row.unit === 'won' ? formatPrice(row.value) : `${row.value}건` }));
}

function WithdrawPage() {
  usePageTitle('회원 탈퇴');
  const navigate = useNavigate();
  const { isLoggedIn, isInitializing, logout } = useAuth();

  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [blockers, setBlockers] = useState(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await withdraw();
      await logout().catch(() => {});
      navigate('/', { replace: true });
    } catch (error) {
      const rows = error.response?.status === 409 ? toBlockers(error.response.data?.data) : [];
      if (rows.length > 0) {
        setBlockers(rows);
      } else {
        setSubmitError(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) return <main className="flex-1" />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/mypage/account/withdraw' }} />;

  return (
    <WithdrawView
      agreed={agreed}
      onAgreeChange={setAgreed}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitError={submitError}
      blockers={blockers}
      onCloseBlocked={() => setBlockers(null)}
    />
  );
}

export default WithdrawPage;
