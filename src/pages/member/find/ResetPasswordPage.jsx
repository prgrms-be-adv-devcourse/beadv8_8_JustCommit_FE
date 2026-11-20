import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword, sendPasswordResetCode, verifyPasswordResetCode } from '../../../api/memberApi';
import useEmailCode from '../../../hooks/useEmailCode';
import usePageTitle from '../../../hooks/usePageTitle';
import { isValidPassword } from '../signup/memberRules';
import { ResetPasswordNewView, ResetPasswordView } from './ResetPasswordView';

// 시안 06-2-1 · 06-2-2 비밀번호 재설정 (이메일 인증 → 재설정 토큰 → 새 비밀번호)
// 발송 응답은 가입 여부와 관계없이 같으므로, 보낸 뒤 문구도 가입 여부를 알리지 않음
const RESET_SENT_TEXT = '가입된 이메일이면 인증번호를 보내 드려요. 메일이 오지 않으면 이메일을 확인해 주세요.';

function ResetPasswordPage() {
  usePageTitle('비밀번호 재설정');
  const navigate = useNavigate();
  const emailCode = useEmailCode({
    sendCode: sendPasswordResetCode,
    verifyCode: verifyPasswordResetCode,
    sentText: RESET_SENT_TEXT,
  });
  const [verifiedEmail, setVerifiedEmail] = useState(null);
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!verifiedEmail) {
    return (
      <ResetPasswordView
        emailCode={emailCode}
        on={{ emailChange: emailCode.setEmail, send: emailCode.send, codeChange: emailCode.setCode }}
        onSubmit={() =>
          emailCode.verify((response) => {
            setResetToken(response?.data?.data?.resetToken ?? '');
            setVerifiedEmail(emailCode.email.trim());
          })
        }
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
      await resetPassword({ resetToken, newPassword: password });
      navigate('/login', { replace: true });
    } catch (resetError) {
      const code = resetError.response?.data?.code;
      const message = resetError.response?.data?.message;
      // 503 RESULT_UNKNOWN: 바뀌었는지 모름. 자동으로 다시 보내지 않고 새 비밀번호로 로그인해 확인 (BE 메시지가 그 안내)
      if (code === 'RESULT_UNKNOWN') {
        navigate('/login', {
          replace: true,
          state: { errorMessage: message ?? '비밀번호 재설정 결과를 확인하지 못했어요. 새 비밀번호로 로그인해 확인해 주세요.' },
        });
        return;
      }
      // 400 INVALID_RESET_TOKEN(만료 30분 · 이미 사용) · 409 MEMBER_BUSY → 이메일 인증부터 다시
      // BE가 토큰을 꺼낼 때 지우므로 MEMBER_BUSY 뒤에도 같은 토큰은 다시 쓸 수 없음
      if (code === 'INVALID_RESET_TOKEN' || code === 'MEMBER_BUSY') {
        emailCode.reset(message ?? '재설정 요청이 만료됐어요. 인증번호를 다시 받아 주세요.');
        setVerifiedEmail(null);
        setResetToken('');
        setPassword('');
        setConfirm('');
        setIsSubmitting(false);
        return;
      }
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
