import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';
import useAuth from '../../../hooks/useAuth';
import { registerSeller, socialSignup } from '../../../api/memberApi';
import { SIGNUP_TOKEN_KEY } from '../SocialSignupPage';
import styles from './SignupStep.module.css';

const INTRO_MAX_LENGTH = 500;

const CHOICES = [
  {
    value: 'seller',
    icon: 'storefront',
    title: '지금 판매자 등록하기',
    description: '가입과 동시에 판매자로 등록되어 바로 식물을 판매할 수 있습니다.',
  },
  {
    value: 'buyer',
    icon: 'shopping_bag',
    title: '나중에 등록하고 구매자로 시작하기',
    description: '먼저 둘러보고 원하는 식물을 구매할 수 있습니다.',
  },
];

// 소셜·일반 가입 공통 항목 (백엔드 SocialSignupRequest 형식)
function toProfileRequest(data) {
  return {
    nickname: data.nickname,
    phone: data.phone,
    bankCode: data.bankCode,
    accountNo: data.accountNo,
    accountHolder: data.accountHolder,
    recipientName: data.recipientName,
    recipientPhone: data.recipientPhone,
    zipcode: data.zipcode,
    address1: data.address1,
    address2: data.address2,
    addressName: data.addressName,
  };
}

// 일반 가입은 공통 항목 + 이메일·비밀번호 (백엔드 SignupRequest 형식)
function toSignupRequest(data) {
  return { email: data.email, password: data.password, ...toProfileRequest(data) };
}

function SellerStep({ initialData, onPrev, socialSignupToken }) {
  const { signup, login, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [choice, setChoice] = useState('seller');
  const [intro, setIntro] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSeller = choice === 'seller';
  const isSocial = Boolean(socialSignupToken);

  const failWith = (error, fallback) => {
    setErrorMessage(error.response?.data?.message ?? fallback);
    setIsSubmitting(false);
  };

  // 일반 가입: 가입 → 로그인 (가입 응답에 토큰이 없음). 성공하면 true
  const localSignup = async () => {
    try {
      await signup(toSignupRequest(initialData));
    } catch (error) {
      failWith(error, '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      return false;
    }

    try {
      await login({ email: initialData.email, password: initialData.password });
    } catch {
      alert('회원가입은 완료되었습니다. 로그인 페이지에서 다시 로그인해 주세요.');
      navigate('/login', { replace: true });
      return false;
    }
    return true;
  };

  // 소셜 가입: 가입 응답의 Refresh 쿠키로 재발급 + 내 정보 조회. 성공하면 true
  const kakaoSignup = async () => {
    try {
      await socialSignup(socialSignupToken, toProfileRequest(initialData));
    } catch (error) {
      if (error.response?.status === 401) {
        sessionStorage.removeItem(SIGNUP_TOKEN_KEY);
        navigate('/login', {
          replace: true,
          state: { errorMessage: '가입 시간이 만료되었습니다. 카카오 로그인을 다시 진행해 주세요.' },
        });
        return false;
      }
      failWith(error, '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      return false;
    }

    sessionStorage.removeItem(SIGNUP_TOKEN_KEY);

    try {
      await refreshUser();
    } catch {
      alert('회원가입은 완료되었습니다. 카카오 로그인을 다시 진행해 주세요.');
      navigate('/login', { replace: true });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    const signedIn = isSocial ? await kakaoSignup() : await localSignup();
    if (!signedIn) return;

    // 판매자 등록 (선택). 실패해도 가입·로그인은 이미 완료된 상태
    if (isSeller) {
      try {
        await registerSeller(intro.trim());
        await refreshUser();
      } catch {
        alert('회원가입은 완료되었지만 판매자 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    }

    navigate('/', { replace: true });
  };

  return (
    <div className={styles.sellerStep}>
      <div className={styles.hero}>
        <span className={styles.badge}>
          <span className="material-symbols-outlined">potted_plant</span>
          마지막 단계 (선택)
        </span>
        <h2 className={styles.heroTitle}>직접 키운 식물을 판매하실 계획이 있으신가요? 🪴</h2>
        <p className={styles.heroDesc}>판매자 등록은 가입 후에도 언제든 할 수 있어요.</p>
      </div>

      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          <span className="material-symbols-outlined">error</span>
          {errorMessage}
        </div>
      )}

      <div className={styles.choices} role="radiogroup">
        {CHOICES.map((item) => {
          const isSelected = choice === item.value;

          return (
            <label
              key={item.value}
              className={`${styles.choice} ${isSelected ? styles.choiceSelected : ''}`}
            >
              <input
                type="radio"
                name="signup-type"
                value={item.value}
                checked={isSelected}
                onChange={() => setChoice(item.value)}
                className={styles.srOnly}
                disabled={isSubmitting}
              />
              <div className={styles.choiceHeader}>
                <span className={styles.choiceIcon}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                </span>
                <span className={styles.choiceCheck}>
                  <span className="material-symbols-outlined">check</span>
                </span>
              </div>
              <span className={styles.choiceTitle}>{item.title}</span>
              <p className={styles.choiceDesc}>{item.description}</p>
            </label>
          );
        })}
      </div>

      {/* 구매자를 골라도 공간은 유지 → 가입 완료 버튼 위치 고정 */}
      <div
        className={`${styles.introCard} ${isSeller ? '' : styles.introHidden}`}
        aria-hidden={!isSeller}
      >
        <label htmlFor="signup-intro" className={styles.label}>
          판매자 소개 <span className={styles.optional}>(선택)</span>
        </label>
        <textarea
          id="signup-intro"
          className={styles.textarea}
          placeholder="어떤 식물을 키우고 판매하시는지 소개해 주세요."
          value={intro}
          onChange={(event) => setIntro(event.target.value)}
          maxLength={INTRO_MAX_LENGTH}
          disabled={isSubmitting || !isSeller}
        />
        <span className={styles.counter}>
          {intro.length} / {INTRO_MAX_LENGTH}
        </span>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.prevButton}
          onClick={onPrev}
          disabled={isSubmitting}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          이전
        </button>
        <Button
          disabled={isSubmitting}
          rightIcon="arrow_forward"
          className={styles.nextButton}
          onClick={handleSubmit}
        >
          {isSubmitting && '가입 처리 중...'}
          {!isSubmitting && (isSeller ? '판매자 등록하고 가입 완료' : '구매자로 가입 완료')}
        </Button>
      </div>
    </div>
  );
}

export default SellerStep;
