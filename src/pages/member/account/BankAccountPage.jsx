import { useState } from 'react';
import { changeAccount, sendAccountEmailCode, verifyAccountEmailCode } from '../../../api/memberApi';
import { ACTION_ERROR } from '../../../constants/actionError';
import { formatBankAccount } from '../../../constants/banks';
import useCountdown from '../../../hooks/useCountdown';
import { toSendError, toVerifyErrorText } from '../../../hooks/useEmailCode';
import usePageTitle from '../../../hooks/usePageTitle';
import AccountGuard from './AccountGuard';
import BankAccountView from './BankAccountView';
import useMyInfo from './useMyInfo';

const CODE_SECONDS = 5 * 60; // 인증번호 유효 5분 (응답 expiresIn이 없을 때)
const RESEND_SECONDS = 60; // 다시 받기 60초 뒤 (응답 resendAvailableIn이 없을 때)

function errorMessage(error) {
  return error.response?.data?.message ?? ACTION_ERROR.DEFAULT;
}

// 258 → "4:18"
function formatMinSec(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatAccount(account) {
  return account ? formatBankAccount(account) : '등록된 계좌가 없어요';
}

function BankAccountPage() {
  usePageTitle('계좌 변경');
  const { myInfo, loadError, reload } = useMyInfo();
  const codeTimer = useCountdown();
  const resendTimer = useCountdown();

  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  // 계좌 변경 토큰이 만료돼 ①로 돌아옴 (06-5-8)
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  // 인증번호 확인으로 받은 일회용 계좌 변경 토큰 (10분)
  const [changeToken, setChangeToken] = useState('');
  const [form, setForm] = useState({ bankCode: '', accountNo: '', accountHolder: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSend = async () => {
    setVerifyError('');
    setIsTokenExpired(false);
    try {
      const response = await sendAccountEmailCode();
      const { expiresIn = CODE_SECONDS, resendAvailableIn = RESEND_SECONDS } = response?.data?.data ?? {};
      setCodeSent(true);
      setCode('');
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
      const response = await verifyAccountEmailCode(code);
      codeTimer.stop();
      setChangeToken(response?.data?.data?.accountChangeToken ?? '');
      setIsVerified(true);
    } catch (error) {
      setVerifyError(toVerifyErrorText(error));
      // 번호는 맞지만 발송 뒤 회원 정보가 바뀜 → 인증번호부터 다시 받기
      if (error.response?.data?.code === 'ACCOUNT_VERIFICATION_INVALID') {
        codeTimer.stop();
        setCodeSent(false);
        setCode('');
      }
    }
  };

  const backToVerify = () => {
    setIsVerified(false);
    setChangeToken('');
    setCodeSent(false);
    setCode('');
  };

  const handleFormChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setSubmitError('');
  };

  // 계좌번호는 하이픈 없이 숫자 10~14자리 (BE AccountChangeRequest)
  const canSubmit =
    form.bankCode !== '' && form.accountNo.length >= 10 && form.accountNo.length <= 14 && form.accountHolder.trim() !== '';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await changeAccount({ ...form, accountHolder: form.accountHolder.trim(), accountChangeToken: changeToken });
      // 바뀐 계좌를 다시 보여 주고 처음 화면으로
      reload();
      backToVerify();
      setForm({ bankCode: '', accountNo: '', accountHolder: '' });
    } catch (error) {
      if (error.response?.data?.code === 'INVALID_ACCOUNT_CHANGE_TOKEN') {
        // 토큰 만료(10분) · 이미 사용 → ① 이메일 인증부터 다시 (06-5-8, 입력한 계좌는 그대로 둠)
        backToVerify();
        setIsTokenExpired(true);
      } else {
        setSubmitError(errorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AccountGuard active="bank" myInfo={myInfo} loadError={loadError}>
      <BankAccountView
        currentAccount={formatAccount(myInfo?.account)}
        isVerified={isVerified}
        email={myInfo?.email ?? ''}
        codeSent={codeSent}
        resendSeconds={resendTimer.remaining}
        codeSecondsText={formatMinSec(codeTimer.remaining)}
        code={code}
        onCodeChange={setCode}
        onSend={handleSend}
        onVerify={handleVerify}
        verifyError={verifyError}
        isTokenExpired={isTokenExpired}
        form={form}
        onFormChange={handleFormChange}
        canSubmit={canSubmit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </AccountGuard>
  );
}

export default BankAccountPage;
