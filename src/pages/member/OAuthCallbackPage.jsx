import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WITHDRAWAL_HELD_NOTICE } from '../../constants/withdrawal';
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

    // 기존 회원 로그인. 탈퇴가 보류됐던 회원이 복구됐으면(?notice=WITHDRAWAL_HELD, BE #616) 홈에서 팝업을 한 번 띄우게 넘김
    // replace라 콜백 주소는 기록에 남지 않아 뒤로 가기로 다시 오지 않음
    const notice = searchParams.get('notice') === WITHDRAWAL_HELD_NOTICE ? WITHDRAWAL_HELD_NOTICE : undefined;
    refreshUser()
      .then(() => navigate('/', { replace: true, state: notice ? { notice } : undefined }))
      .catch(() => goLoginWithError(DEFAULT_ERROR));
  }, [navigate, searchParams, refreshUser]);

  return <p style={{ textAlign: 'center', padding: '4rem 0' }}>로그인 처리 중...</p>;
}
