import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getWithdrawalEligibility, withdraw } from '../../../api/memberApi';
import { ACTION_ERROR } from '../../../constants/actionError';
import useAuth from '../../../hooks/useAuth';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatPrice } from '../../../utils/format';
import WithdrawView from './WithdrawView';
import { AccountMenuContext } from './accountMenuContext';
import useMyInfo from './useMyInfo';

// 탈퇴가 막힌 이유 → 모달 줄 (06-5-13, 값이 없거나 0이면 그 줄은 숨김)
// details: 서비스별 blockers[].details를 합친 것 (BE WithdrawalEligibilityResponse)
//   market activeBuyerOrderCount · activeSellerOrderCount / payment walletBalance · hasPendingTransactions · outstandingDebt
//   settlement incompleteSettlementCount
function toBlockers(details = {}) {
  return [
    { value: details.activeBuyerOrderCount, label: '구매 확정 전인 주문', unit: 'count', linkLabel: '주문 내역 보기', to: '/orders' },
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

// 탈퇴 가능 여부 응답 → 서비스별 details를 하나로 합침 (이름이 서비스마다 달라 겹치지 않음)
function mergeBlockerDetails(eligibility) {
  return Object.assign({}, ...(eligibility?.blockers ?? []).map((blocker) => blocker.details ?? {}));
}

// 금액은 BigDecimal이라 문자열로 올 수 있어 숫자로 맞춤
function toNumberDetails(details) {
  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [key, typeof value === 'string' ? Number(value) : value]),
  );
}

const UNAVAILABLE_CODES = ['WITHDRAWAL_CHECK_UNAVAILABLE'];

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
    // 탈퇴 가능 여부 확인 → 막혔으면 사유 모달(또는 오류 문구)을 띄우고 true
    const showBlockersIfBlocked = async () => {
      const eligibility = (await getWithdrawalEligibility()).data.data;
      if (eligibility?.status === 'ALLOWED') return false;
      const rows = toBlockers(toNumberDetails(mergeBlockerDetails(eligibility)));
      if (rows.length > 0) setBlockers(rows);
      else setSubmitError(ACTION_ERROR.DEFAULT);
      return true;
    };
    try {
      // ① 탈퇴 가능 여부 먼저 (막힌 이유는 이 응답에만 있음, POST의 409 WITHDRAWAL_BLOCKED에는 사유 없음)
      if (await showBlockersIfBlocked()) return;
      // ② 최종 탈퇴
      // TODO: 재확인 입력 칸이 시안에 없음 → 로컬 회원은 현재 비밀번호(password),
      //  카카오 회원은 이메일 인증(sendWithdrawalEmailCode · verifyWithdrawalEmailCode)으로 받은 withdrawalToken을 보내야 함.
      //  시안에 칸이 생기기 전까지는 값 없이 보내 400 BAD_REQUEST_DATA 안내가 보임
      await withdraw();
      await logout().catch(() => {});
      navigate('/', { replace: true });
    } catch (error) {
      const code = error.response?.data?.code;
      if (UNAVAILABLE_CODES.includes(code)) {
        // 탈퇴 확인을 하지 못함 (06-5-14)
        setIsUnavailable(true);
      } else if (code === 'WITHDRAWAL_BLOCKED') {
        // 409: 확인 뒤 사이에 막힘 (사유는 사전 확인 GET에만 있음) → 다시 조회해 사유 모달
        try {
          if (!(await showBlockersIfBlocked())) setSubmitError(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
        } catch (recheckError) {
          if (UNAVAILABLE_CODES.includes(recheckError.response?.data?.code)) setIsUnavailable(true);
          else setSubmitError(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
        }
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
