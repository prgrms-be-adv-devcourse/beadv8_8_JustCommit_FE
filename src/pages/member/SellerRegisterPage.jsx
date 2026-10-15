import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { registerSeller } from '../../api/memberApi';
import pageStyles from './SignupPage.module.css';
import styles from './signup/SignupStep.module.css';

const INTRO_MAX_LENGTH = 500;

function SellerRegisterPage() {
  usePageTitle('판매자 등록');
  const { user, isLoggedIn, isInitializing, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [intro, setIntro] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로그인 상태 복구가 끝나기 전에는 판단하지 않음
  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user.role === 'SELLER' && !isSubmitting) return <Navigate to="/" replace />;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await registerSeller(intro.trim());
      await refreshUser();
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ?? '판매자 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.background} aria-hidden="true">
        <div className={pageStyles.glowTop} />
        <div className={pageStyles.glowRight} />
      </div>

      <div className={pageStyles.content}>
        <div className={styles.sellerStep}>
          <div className={styles.hero}>
            <span className={styles.badge}>
              <span className="material-symbols-outlined">storefront</span>
              판매자 등록
            </span>
            <h2 className={styles.heroTitle}>직접 키운 식물을 판매해 보세요 🪴</h2>
            <p className={styles.heroDesc}>
              판매자로 등록하면 바로 식물을 등록하고 판매할 수 있어요.
            </p>
          </div>

          {errorMessage && (
            <div className={styles.errorBanner} role="alert">
              <span className="material-symbols-outlined">error</span>
              {errorMessage}
            </div>
          )}

          <div className={`${styles.choice} ${styles.choiceSelected}`} style={{ cursor: 'default' }}>
            <div className={styles.choiceHeader}>
              <span className={styles.choiceIcon}>
                <span className="material-symbols-outlined">storefront</span>
              </span>
              <span className={styles.choiceCheck}>
                <span className="material-symbols-outlined">check</span>
              </span>
            </div>
            <span className={styles.choiceTitle}>{user.nickname}님을 판매자로 등록합니다</span>
            <p className={styles.choiceDesc}>
              판매 대금은 회원가입 때 등록한 정산 계좌로 지급됩니다.
            </p>
          </div>

          <div className={styles.introCard}>
            <label htmlFor="seller-intro" className={styles.label}>
              판매자 소개 <span className={styles.optional}>(선택)</span>
            </label>
            <textarea
              id="seller-intro"
              className={styles.textarea}
              placeholder="어떤 식물을 키우고 판매하시는지 소개해 주세요."
              value={intro}
              onChange={(event) => setIntro(event.target.value)}
              maxLength={INTRO_MAX_LENGTH}
              disabled={isSubmitting}
            />
            <span className={styles.counter}>
              {intro.length} / {INTRO_MAX_LENGTH}
            </span>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.prevButton}
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              취소
            </button>
            <Button
              disabled={isSubmitting}
              rightIcon="arrow_forward"
              className={styles.nextButton}
              onClick={handleSubmit}
            >
              {isSubmitting ? '등록 중...' : '판매자 등록하기'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerRegisterPage;
