import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const DEFAULT_ERROR = '로그인 중 문제가 발생했어요. 다시 시도해 주세요.';

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

    // 실패: ?error=코드 → 로그인 화면 위쪽 안내 상자 (문구는 LoginPage에서 코드별로 정함)
    // TODO(member): 가린 이메일을 ?maskedEmail= 로 넘겨 주면 06-1-3 문구에 넣습니다.
    const errorCode = searchParams.get('error');
    if (errorCode) {
      navigate('/login', {
        replace: true,
        state: { socialError: { code: errorCode, maskedEmail: searchParams.get('maskedEmail') ?? undefined } },
      });
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
