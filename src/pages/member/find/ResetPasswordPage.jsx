import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword, sendPasswordResetCode, verifyPasswordResetCode } from '../../../api/memberApi';
import useEmailCode from '../../../hooks/useEmailCode';
import usePageTitle from '../../../hooks/usePageTitle';
import { isValidPassword } from '../signup/memberRules';
import { ResetPasswordNewView, ResetPasswordView } from './ResetPasswordView';

// 시안 06-2-3 · 06-2-4 비밀번호 재설정 (이메일 인증 → 새 비밀번호)
function ResetPasswordPage() {
  usePageTitle('비밀번호 재설정');
  const navigate = useNavigate();
  const emailCode = useEmailCode({ sendCode: sendPasswordResetCode, verifyCode: verifyPasswordResetCode });
  const [verifiedEmail, setVerifiedEmail] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!verifiedEmail) {
    return (
      <ResetPasswordView
        emailCode={emailCode}
        on={{ emailChange: emailCode.setEmail, send: emailCode.send, codeChange: emailCode.setCode }}
        onSubmit={() => emailCode.verify(() => setVerifiedEmail(emailCode.email.trim()))}
      />
    );
  }

  const isPasswordValid = isValidPassword(password);
  const isMatch = confirm.length > 0 && password === confirm;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!isPasswordValid) {
      setError('비밀번호는 8 ~ 20자, 영문과 숫자를 모두 넣어 주세요');
      return;
    }
    if (!isMatch) {
      setError('비밀번호가 일치하지 않아요');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await resetPassword({ email: verifiedEmail, newPassword: password });
      navigate('/login', { replace: true });
    } catch (resetError) {
      setError(resetError.response?.data?.message ?? '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.');
      setIsSubmitting(false);
    }
  };

  return (
    <ResetPasswordNewView
      email={verifiedEmail}
      password={password}
      confirm={confirm}
      passwordState={password && !isPasswordValid ? 'error' : 'default'}
      confirmState={confirm && !isMatch ? 'error' : 'default'}
      on={{ passwordChange: setPassword, confirmChange: setConfirm }}
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSubmitting}
    />
  );
}

export default ResetPasswordPage;
