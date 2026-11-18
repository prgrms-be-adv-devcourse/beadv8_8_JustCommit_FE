import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { withdraw } from '../../../api/memberApi';
import { ACTION_ERROR } from '../../../constants/actionError';
import useAuth from '../../../hooks/useAuth';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatPrice } from '../../../utils/format';
import WithdrawView from './WithdrawView';
import { AccountMenuContext } from './accountMenuContext';
import useMyInfo from './useMyInfo';

// 탈퇴가 막힌 이유 → 모달 줄 (06-5-13, 값이 없거나 0이면 그 줄은 숨김)
// details 이름: 백엔드 탈퇴 확인 결과 (activeSellerOrderCount · incompleteSettlementCount · hasPendingTransactions · outstandingDebt)
// TODO(member): 구매 주문 수 · 예치금 잔액 이름(pendingOrderCount · walletBalance)은 외부 응답이 정해지면 맞춤
function toBlockers(details = {}) {
  return [
    { value: details.pendingOrderCount, label: '구매 확정 전인 주문', unit: 'count', linkLabel: '주문 내역 보기', to: '/orders' },
    {
      value: details.activeSellerOrderCount,
      label: '진행 중인 판매 주문',
      unit: 'count',
      linkLabel: '판매 주문 보기',
      to: '/orders/seller',
    },
    { value: details.walletBalance, label: '예치금 잔액', unit: 'won', linkLabel: '예치금 정리하기', to: '/wallet' },
    { value: details.hasPendingTransactions, label: '진행 중인 충전 · 인출', unit: 'flag', linkLabel: '예치금 보기', to: '/wallet' },
    {
      value: details.incompleteSettlementCount,
      label: '완료되지 않은 정산',
      unit: 'count',
      linkLabel: '정산 리포트 보기',
      to: '/settlements',
    },
    { value: details.outstandingDebt, label: '미수금', unit: 'won', linkLabel: '예치금 보기', to: '/wallet' },
  ]
    .filter((row) => (row.unit === 'flag' ? row.value === true : row.value > 0))
    .map((row) => {
      if (row.unit === 'flag') return { ...row, valueText: '' };
      return { ...row, valueText: row.unit === 'won' ? formatPrice(row.value) : `${row.value}건` };
    });
}

// 실패 응답 → { result, details }. data가 { result, details }여도, details만 와도 읽음
function readWithdrawalCheck(error) {
  const data = error.response?.data?.data ?? {};
  return { result: data.result ?? error.response?.data?.code, details: data.details ?? data };
}

function WithdrawPage() {
  usePageTitle('회원 탈퇴');
  const navigate = useNavigate();
  const { isLoggedIn, isInitializing, logout } = useAuth();

  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // 메뉴에서 카카오 회원의 「비밀번호 변경」 탭을 숨기려고 가입 방식만 봄
  const { myInfo } = useMyInfo();
  const [blockers, setBlockers] = useState(null);
  const [isUnavailable, setIsUnavailable] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await withdraw();
      await logout().catch(() => {});
      navigate('/', { replace: true });
    } catch (error) {
      const { result, details } = readWithdrawalCheck(error);
      const rows = error.response?.status === 409 ? toBlockers(details) : [];
      if (result === 'UNAVAILABLE') {
        // 탈퇴 확인을 하지 못함 (06-5-14)
        setIsUnavailable(true);
      } else if (rows.length > 0) {
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
    <AccountMenuContext.Provider value={{ isKakao: myInfo?.provider === 'KAKAO' }}>
      <WithdrawView
      agreed={agreed}
      onAgreeChange={setAgreed}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitError={submitError}
      blockers={blockers}
      onCloseBlocked={() => setBlockers(null)}
      isUnavailable={isUnavailable}
      onCloseUnavailable={() => setIsUnavailable(false)}
      />
    </AccountMenuContext.Provider>
  );
}

export default WithdrawPage;
