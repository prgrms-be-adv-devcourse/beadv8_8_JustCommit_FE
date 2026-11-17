import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { socialSignup } from '../../api/memberApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatTime } from '../../utils/format';
import { SocialSignupView } from './signup/SignupViews';
import useMemberInfoForm from './signup/useMemberInfoForm';

// 시안 06-3-9 카카오 가입 (가입 토큰 10분 안에 정보 입력)

const SIGNUP_TOKEN_KEY = 'socialSignupToken';
const LOGIN_AGAIN = '가입 시간이 지났어요. 카카오 로그인부터 다시 해 주세요.';

// 콜백 페이지에서 받은 토큰을 sessionStorage에 옮겨 두고 꺼냄 (새로고침 대비)
function useSignupToken() {
  const location = useLocation();
  const [token] = useState(() => {
    const fromState = location.state?.signupToken;
    if (fromState) {
      sessionStorage.setItem(SIGNUP_TOKEN_KEY, fromState);
      return fromState;
    }
    return sessionStorage.getItem(SIGNUP_TOKEN_KEY);
  });
  return token;
}

// 가입 토큰(JWT)의 email · exp 읽기 (서명 확인은 서버가 함, 화면 표시용)
function readTokenClaims(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    const { email, exp } = JSON.parse(json);
    return { email: email ?? '', expiresAt: exp ? exp * 1000 : null };
  } catch {
    return { email: '', expiresAt: null };
  }
}

function useRemainingSeconds(expiresAt) {
  const calc = () => (expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : null);
  const [remaining, setRemaining] = useState(calc);
  useEffect(() => {
    if (!expiresAt) return undefined;
    const timerId = setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timerId);
  }, [expiresAt]);
  return remaining;
}

function SocialSignupPage() {
  usePageTitle('카카오 회원가입');
  const { isLoggedIn, refreshUser } = useAuth();
  const navigate = useNavigate();
  const signupToken = useSignupToken();
  const [claims] = useState(() => (signupToken ? readTokenClaims(signupToken) : { email: '', expiresAt: null }));
  const remaining = useRemainingSeconds(claims.expiresAt);
  const info = useMemberInfoForm({ withPassword: false });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoggedIn && !isSubmitting) {
    return <Navigate to="/" replace />;
  }
  if (!signupToken) {
    return <Navigate to="/login" replace state={{ errorMessage: '가입 정보가 없어요. 카카오 로그인부터 다시 해 주세요.' }} />;
  }

  const goLoginAgain = () => {
    sessionStorage.removeItem(SIGNUP_TOKEN_KEY);
    navigate('/login', { replace: true, state: { errorMessage: LOGIN_AGAIN } });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (remaining === 0) {
      goLoginAgain();
      return;
    }
    const problem = info.validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await socialSignup(signupToken, info.toProfileRequest());
    } catch (signupError) {
      if (signupError.response?.status === 401) {
        goLoginAgain();
        return;
      }
      setError(signupError.response?.data?.message ?? '가입하지 못했어요. 잠시 후 다시 시도해 주세요.');
      setIsSubmitting(false);
      return;
    }

    sessionStorage.removeItem(SIGNUP_TOKEN_KEY);
    try {
      // 가입 응답의 Refresh 쿠키로 재발급 + 내 정보 조회
      await refreshUser();
      navigate('/', { replace: true });
    } catch {
      navigate('/login', {
        replace: true,
        state: { errorMessage: '가입은 끝났어요. 카카오 로그인을 한 번 더 해 주세요.' },
      });
    }
  };

  return (
    <SocialSignupView
      email={claims.email || '{카카오 이메일}'}
      remainingText={remaining === null ? '{남은 시간}' : formatTime(remaining)}
      form={info.form}
      on={info.on}
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSubmitting}
    />
  );
}

export default SocialSignupPage;
