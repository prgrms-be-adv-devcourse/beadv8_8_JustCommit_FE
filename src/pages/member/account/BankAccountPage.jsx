import { useState } from 'react';
import { changeAccount, sendAccountEmailCode, verifyAccountEmailCode } from '../../../api/memberApi';
import { ACTION_ERROR } from '../../../constants/actionError';
import { BANKS } from '../../../constants/banks';
import useCountdown from '../../../hooks/useCountdown';
import usePageTitle from '../../../hooks/usePageTitle';
import AccountGuard from './AccountGuard';
import BankAccountView from './BankAccountView';
import useMyInfo from './useMyInfo';

const CODE_SECONDS = 5 * 60; // 인증번호 유효 5분
const RESEND_SECONDS = 60; // 다시 받기 60초 뒤

function errorMessage(error) {
  return error.response?.data?.message ?? ACTION_ERROR.DEFAULT;
}

// 258 → "4:18"
function formatMinSec(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

// 화면은 뒤 4자리만 (번호 마스킹 · 예금주 표시는 백엔드 응답 그대로)
function formatAccount(account) {
  if (!account) return '등록된 계좌가 없어요';
  const bankName = BANKS.find((bank) => bank.code === account.bankCode)?.name ?? account.bankCode;
  return `${bankName} ${account.maskedAccountNo} · 예금주 ${account.accountHolder}`;
}

function BankAccountPage() {
  usePageTitle('계좌 변경');
  const { myInfo, loadError, reload } = useMyInfo();
  const codeTimer = useCountdown();
  const resendTimer = useCountdown();

  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [form, setForm] = useState({ bankCode: '', accountNo: '', accountHolder: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSend = async () => {
    setVerifyError('');
    try {
      await sendAccountEmailCode();
      setCodeSent(true);
      setCode('');
      codeTimer.start(CODE_SECONDS);
      resendTimer.start(RESEND_SECONDS);
    } catch (error) {
      setVerifyError(errorMessage(error));
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
      await verifyAccountEmailCode(code);
      codeTimer.stop();
      setIsVerified(true);
    } catch (error) {
      setVerifyError(errorMessage(error));
    }
  };

  const handleFormChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setSubmitError('');
  };

  const canSubmit = form.bankCode !== '' && form.accountNo.length >= 8 && form.accountHolder.trim() !== '';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await changeAccount({ ...form, accountHolder: form.accountHolder.trim() });
      // 바뀐 계좌를 다시 보여 주고 처음 화면으로
      reload();
      setIsVerified(false);
      setCodeSent(false);
      setForm({ bankCode: '', accountNo: '', accountHolder: '' });
    } catch (error) {
      setSubmitError(errorMessage(error));
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
