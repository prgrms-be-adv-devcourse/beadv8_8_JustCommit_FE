import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const ERROR_MESSAGES = {
  SOCIAL_LOGIN_FAILED: '카카오 로그인에 실패했습니다. 다시 시도해 주세요.',
};
const DEFAULT_ERROR = '로그인 중 문제가 발생했습니다. 다시 시도해 주세요.';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const goLoginWithError = (message) =>
      navigate('/login', { replace: true, state: { errorMessage: message } });

    const errorCode = searchParams.get('error');
    if (errorCode) {
      goLoginWithError(ERROR_MESSAGES[errorCode] ?? DEFAULT_ERROR);
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const signupToken = hashParams.get('signupToken');
    if (signupToken) {
      navigate('/signup/social', { replace: true, state: { signupToken } });
      return;
    }

    refreshUser()
      .then(() => navigate('/', { replace: true }))
      .catch(() => goLoginWithError(DEFAULT_ERROR));
  }, [navigate, searchParams, refreshUser]);

  return <p style={{ textAlign: 'center', padding: '4rem 0' }}>로그인 처리 중...</p>;
}
