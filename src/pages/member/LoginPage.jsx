import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ACTION_ERROR } from '../../constants/actionError';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { startKakaoLogin } from '../../utils/oauth';
import LoginView from './login/LoginView';

// 카카오 로그인 실패 코드 → 위쪽 안내 상자 (OAuthCallbackPage가 state.socialError로 넘김)
// 백엔드 SocialLoginSuccessHandler가 SOCIAL_EMAIL_CONFLICT · SOCIAL_EMAIL_REQUIRED를 ?error=로 넘김
// TODO(member): 가린 이메일(ki***@example.com)은 콜백 주소로 넘기지 않음 → 넘겨 주면 06-1-3 문구에 넣음 (그전까지 이메일 없이 안내)
function toSocialNotice({ code, maskedEmail }) {
  if (code === 'SOCIAL_EMAIL_CONFLICT') {
    return {
      type: 'error',
      text: `카카오 계정의 이메일${maskedEmail ? `(${maskedEmail})` : ''}로 이미 가입한 계정이 있어요. 이메일과 비밀번호로 로그인해 주세요.`,
    };
  }
  if (code === 'SOCIAL_EMAIL_REQUIRED') {
    return { type: 'warning', text: '카카오 로그인에는 이메일 제공 동의가 필요해요. 다시 시작할 때 이메일 제공에 동의해 주세요.' };
  }
  return { type: 'error', text: '카카오 로그인에 실패했어요. 다시 시도해 주세요.' };
}

function getInitialNotice(state) {
  if (state?.socialError) return toSocialNotice(state.socialError);
  if (state?.errorMessage) return { type: 'error', text: state.errorMessage };
  return null;
}

function LoginPage() {
  usePageTitle('로그인');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggedIn, isInitializing } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice] = useState(() => getInitialNotice(location.state));
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이미 로그인한 사용자는 원래 가려던 곳(없으면 홈)으로
  if (!isInitializing && isLoggedIn && !isSubmitting) {
    return <Navigate to={location.state?.from ?? '/'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!email.trim() || !password) {
      setError({ text: '이메일과 비밀번호를 입력해 주세요', highlight: false });
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (loginError) {
      const code = loginError.response?.data?.code;
      if (code === 'LOGIN_FAILED') {
        setError({ text: '이메일 또는 비밀번호가 맞지 않아요', highlight: true });
      } else if (code === 'TOO_MANY_REQUESTS') {
        // Gateway 요청 수 제한 (IP당 1분 5회) → 공통 문구 (시안 01-1-5)
        setError({ text: ACTION_ERROR.TOO_MANY_REQUESTS, highlight: false });
      } else {
        setError({
          text: loginError.response?.data?.message ?? '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.',
          highlight: false,
        });
      }
      setIsSubmitting(false);
    }
  };

  return (
    <LoginView
      email={email}
      password={password}
      onEmailChange={(event) => setEmail(event.target.value)}
      onPasswordChange={(event) => setPassword(event.target.value)}
      onSubmit={handleSubmit}
      onKakao={startKakaoLogin}
      notice={notice}
      error={error}
      isSubmitting={isSubmitting}
    />
  );
}

export default LoginPage;
