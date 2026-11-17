import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../../../api/memberApi';
import { ACTION_ERROR } from '../../../constants/actionError';
import useAuth from '../../../hooks/useAuth';
import usePageTitle from '../../../hooks/usePageTitle';
import AccountGuard from './AccountGuard';
import PasswordView from './PasswordView';
import useMyInfo from './useMyInfo';

// 8~20자, 영문 · 숫자 각 1개 이상 (BE docs/services/member.md 「입력 규칙」)
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

function PasswordPage() {
  usePageTitle('비밀번호 변경');
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { myInfo, loadError } = useMyInfo();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isDone, setIsDone] = useState(false);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setSubmitError('');
  };

  const newPasswordError =
    form.newPassword && !PASSWORD_REGEX.test(form.newPassword) ? '8 ~ 20자로 영문과 숫자를 모두 넣어 주세요' : '';
  const confirmError =
    form.confirmPassword && form.confirmPassword !== form.newPassword ? '새 비밀번호와 같게 입력해 주세요' : '';
  const canSubmit =
    form.currentPassword !== '' &&
    PASSWORD_REGEX.test(form.newPassword) &&
    form.confirmPassword === form.newPassword;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setIsDone(true);
    } catch (error) {
      setSubmitError(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 서버가 모든 기기의 토큰을 폐기했으므로 이 기기도 로그아웃 후 로그인 화면으로
  const handleLogin = async () => {
    await logout().catch(() => {});
    navigate('/login', { replace: true });
  };

  return (
    <AccountGuard active="password" myInfo={myInfo} loadError={loadError}>
      <PasswordView
        isSocial={myInfo?.provider && myInfo.provider !== 'LOCAL'}
        form={form}
        onChange={handleChange}
        newPasswordError={newPasswordError}
        confirmError={confirmError}
        canSubmit={canSubmit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        submitError={submitError}
        isDone={isDone}
        onLogin={handleLogin}
      />
    </AccountGuard>
  );
}

export default PasswordPage;
