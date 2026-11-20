import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  getWithdrawalEligibility,
  sendWithdrawalEmailCode,
  verifyWithdrawalEmailCode,
  withdraw,
} from '../../../api/memberApi';
import { ACTION_ERROR } from '../../../constants/actionError';
import useAuth from '../../../hooks/useAuth';
import useCountdown from '../../../hooks/useCountdown';
import { toSendError, toVerifyErrorText } from '../../../hooks/useEmailCode';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatPrice } from '../../../utils/format';
import WithdrawView from './WithdrawView';
import { AccountMenuContext } from './accountMenuContext';
import useMyInfo from './useMyInfo';

// 탈퇴가 막힌 이유 → 모달 줄 (06-5-16, 값이 없거나 0이면 그 줄은 숨김)
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
const CODE_SECONDS = 5 * 60; // 인증번호 유효 5분 (응답 expiresIn이 없을 때)
const RESEND_SECONDS = 60; // 다시 받기 60초 뒤 (응답 resendAvailableIn이 없을 때)

// 258 → "4:18"
function formatMinSec(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function WithdrawPage() {
  usePageTitle('회원 탈퇴');
  const navigate = useNavigate();
  const { isLoggedIn, isInitializing, logout } = useAuth();

  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // 가입 방식(provider): 카카오 회원은 메뉴에서 「비밀번호 변경」을 숨기고, 본인 확인을 이메일 인증으로 받음
  const { myInfo } = useMyInfo();
  const [blockers, setBlockers] = useState(null);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const isKakao = myInfo?.provider === 'KAKAO';

  // 일반 회원 본인 확인: 현재 비밀번호 (06-5-13 · 06-5-14)
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(''); // '' | 'wrong' | 'locked'
  const handlePasswordChange = (value) => {
    setPassword(value);
    setPasswordError('');
    setSubmitError('');
  };

  // 카카오 회원 본인 확인: 이메일 인증번호 → 탈퇴 토큰(10분) (06-5-15)
  const codeTimer = useCountdown();
  const resendTimer = useCountdown();
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [withdrawalToken, setWithdrawalToken] = useState('');

  const resetEmailVerify = () => {
    codeTimer.stop();
    setCodeSent(false);
    setCode('');
    setWithdrawalToken('');
  };

  const handleSend = async () => {
    setVerifyError('');
    try {
      const response = await sendWithdrawalEmailCode();
      const { expiresIn = CODE_SECONDS, resendAvailableIn = RESEND_SECONDS } = response?.data?.data ?? {};
      setCodeSent(true);
      setCode('');
      setWithdrawalToken('');
      codeTimer.start(expiresIn);
      resendTimer.start(resendAvailableIn);
    } catch (error) {
      setVerifyError(toSendError(error).text);
    }
  };

  const handleVerify = async () => {
    if (!codeTimer.isRunning) {
      setVerifyError('인증번호가 만료됐어요. 다시 받아 주세요');
      return;
    }
    if (code.length !== 6) {
      setVerifyError('6자리 숫자를 입력해 주세요');
      return;
    }
    setVerifyError('');
    try {
      const response = await verifyWithdrawalEmailCode(code);
      codeTimer.stop();
      setWithdrawalToken(response?.data?.data?.withdrawalToken ?? '');
    } catch (error) {
      setVerifyError(toVerifyErrorText(error));
      // 번호는 맞지만 발송 뒤 회원 정보가 바뀜 → 인증번호부터 다시 받기
      if (error.response?.data?.code === 'WITHDRAWAL_VERIFICATION_INVALID') resetEmailVerify();
    }
  };

  const verified = withdrawalToken !== '';
  const canSubmit = agreed && (isKakao ? verified : password !== '');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      // ① 탈퇴 가능 여부 먼저 (막힌 이유는 이 응답에만 있음, POST의 409 WITHDRAWAL_BLOCKED에는 사유 없음)
      const eligibility = (await getWithdrawalEligibility()).data.data;
      if (eligibility?.status !== 'ALLOWED') {
        const rows = toBlockers(toNumberDetails(mergeBlockerDetails(eligibility)));
        if (rows.length > 0) setBlockers(rows);
        else setSubmitError(ACTION_ERROR.DEFAULT);
        return;
      }
      // ② 최종 탈퇴: 일반 회원은 password, 카카오 회원은 withdrawalToken 하나만
      await withdraw(isKakao ? { withdrawalToken } : { password });
      await logout().catch(() => {});
      navigate('/', { replace: true });
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === 'INVALID_CURRENT_PASSWORD') {
        setPasswordError('wrong'); // 06-5-14
      } else if (code === 'PASSWORD_CHANGE_LOCKED') {
        setPasswordError('locked');
      } else if (code === 'INVALID_WITHDRAWAL_TOKEN') {
        // 탈퇴 토큰 만료(10분) · 이미 사용 → 이메일 인증부터 다시
        resetEmailVerify();
        setVerifyError('인증 시간이 지났어요. 이메일 인증을 다시 해 주세요');
      } else if (UNAVAILABLE_CODES.includes(code)) {
        // 탈퇴 확인을 하지 못함 (06-5-17)
        setIsUnavailable(true);
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
      canSubmit={canSubmit}
      submitError={submitError}
      isKakao={isKakao}
      password={password}
      onPasswordChange={handlePasswordChange}
      passwordError={passwordError}
      emailVerify={{
        email: myInfo?.email ?? '',
        codeSent,
        resendSeconds: resendTimer.remaining,
        codeSecondsText: formatMinSec(codeTimer.remaining),
        code,
        onCodeChange: setCode,
        onSend: handleSend,
        onVerify: handleVerify,
        verifyError,
        isVerified: verified,
      }}
      blockers={blockers}
      onCloseBlocked={() => setBlockers(null)}
      isUnavailable={isUnavailable}
      onCloseUnavailable={() => setIsUnavailable(false)}
      />
    </AccountMenuContext.Provider>
  );
}

export default WithdrawPage;
