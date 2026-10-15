import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import usePageTitle from '../../hooks/usePageTitle';
import styles from './LoginPage.module.css';

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.477 2 10.768c0 2.766 1.834 5.188 4.606 6.539l-.936 3.473c-.083.308.261.55.518.379l4.135-2.735c.555.076 1.11.112 1.677.112 5.523 0 10-3.477 10-7.768C22 6.477 17.523 3 12 3z" />
    </svg>
  );
}

function LoginPage() {
  usePageTitle('로그인');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await login(form);
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ?? '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKakaoLogin = () => {
    // TODO: #102 카카오 콜백 프론트 리다이렉트 처리 후 연결
    alert('카카오 로그인은 준비 중입니다.');
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={`${styles.glow} ${styles.glowTop}`} aria-hidden="true" />
        <div className={`${styles.glow} ${styles.glowBottom}`} aria-hidden="true" />

        <div className={styles.card}>
          {/* 로고 · 인사 */}
          <div className={styles.brand}>
            <Link to="/" className={styles.logo}>
              <img src="/favicon.svg" alt="" className={styles.logoIcon} />
              <span>replant</span>
            </Link>
            <h1 className={styles.title}>식물 집사님, 반갑습니다</h1>
            <p className={styles.subtitle}>반려식물 안전 에스크로 마켓에 오신 것을 환영해요</p>
          </div>

          {/* 에러 배너 */}
          {errorMessage && (
            <div className={styles.errorBanner} role="alert">
              <span className={`material-symbols-outlined ${styles.errorIcon}`} aria-hidden="true">
                error
              </span>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* 로그인 폼 */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              label="이메일"
              icon="mail"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@replant.kr"
              autoComplete="email"
              required
            />
            <Input
              label="비밀번호"
              icon="lock"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              required
            />
            <Button
              type="submit"
              fullWidth
              rightIcon={isSubmitting ? undefined : 'arrow_forward'}
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          {/* 간편 로그인 */}
          <div className={styles.divider}>
            <span>또는 간편 로그인</span>
          </div>
          <Button variant="kakao" fullWidth leftIcon={<KakaoIcon />} onClick={handleKakaoLogin}>
            카카오로 시작하기
          </Button>

          {/* 회원가입 안내 */}
          <p className={styles.signup}>
            아직 replant 회원이 아니신가요?
            <Link to="/signup" className={styles.signupLink}>
              회원가입하기
              <span className="material-symbols-outlined" aria-hidden="true">
                chevron_right
              </span>
            </Link>
          </p>
        </div>

        {/* 안심 거래 배너 */}
        <div className={styles.trustBanner}>
          <div className={styles.trustIcon}>
            <span className="material-symbols-outlined" aria-hidden="true">
              verified_user
            </span>
          </div>
          <div className={styles.trustText}>
            <div className={styles.trustTitle}>
              <span>replant 안심 인증 거래</span>
              <span className={styles.badge}>1개체 1판매</span>
            </div>
            <p>사진 속 실물 그대로, 수령 확정 시 정산되는 안심 에스크로 마켓입니다.</p>
          </div>
        </div>

        {/* 약관 링크 */}
        <nav className={styles.policyLinks}>
          <Link to="/terms">이용약관</Link>
          <span aria-hidden="true">•</span>
          <Link to="/privacy">개인정보처리방침</Link>
          <span aria-hidden="true">•</span>
          <Link to="/safety-policy">안전 보증 정책</Link>
        </nav>
      </div>
    </div>
  );
}

export default LoginPage;
