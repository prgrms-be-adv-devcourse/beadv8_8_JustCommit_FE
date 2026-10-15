import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';
import useAuth from '../../../hooks/useAuth';
import { registerSeller } from '../../../api/memberApi';
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

// 1~3단계에서 모은 값을 백엔드 SignupRequest 형식으로 정리
function toSignupRequest(data) {
  return {
    email: data.email,
    password: data.password,
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

function SellerStep({ initialData, onPrev }) {
  const { signup, login, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [choice, setChoice] = useState('seller');
  const [intro, setIntro] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSeller = choice === 'seller';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    // 1. 회원가입 (실패하면 화면에 에러를 보여 주고 그대로 머묾)
    try {
      await signup(toSignupRequest(initialData));
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ?? '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
      setIsSubmitting(false);
      return;
    }

    // 2. 로그인 (회원가입 응답에는 토큰이 없어서 직접 로그인)
    try {
      await login({ email: initialData.email, password: initialData.password });
    } catch {
      alert('회원가입은 완료되었습니다. 로그인 페이지에서 다시 로그인해 주세요.');
      navigate('/login', { replace: true });
      return;
    }

    // 3. 판매자 등록 (선택). 실패해도 가입·로그인은 이미 완료된 상태
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
