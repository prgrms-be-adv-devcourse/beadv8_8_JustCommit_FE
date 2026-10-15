import { useState } from 'react';
import Stepper from '../../components/common/Stepper';
import usePageTitle from '../../hooks/usePageTitle';
import AccountStep from './signup/AccountStep';
import styles from './SignupPage.module.css';

const SIGNUP_STEPS = [
  { title: '계정 인증', icon: 'mail', description: '대기' },
  { title: '기본 정보', icon: 'potted_plant', description: '대기' },
  { title: '계좌 등록', icon: 'account_balance', description: '대기' },
  { title: '판매자 등록', icon: 'storefront', description: '선택' },
];

function SignupPage() {
  usePageTitle('회원가입');
  const [currentStep, setCurrentStep] = useState(0);
  const [signupData, setSignupData] = useState({});

  const goNext = (stepData) => {
    setSignupData((prev) => ({ ...prev, ...stepData }));
    setCurrentStep((step) => step + 1);
    window.scrollTo(0, 0);
  };

  const goPrev = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
    window.scrollTo(0, 0);
  };

  return (
    <div className={styles.page}>
      <div className={styles.background} aria-hidden="true">
        <div className={styles.glowTop} />
        <div className={styles.glowRight} />
      </div>

      <div className={styles.content}>
        <div className={styles.stepper}>
          <Stepper steps={SIGNUP_STEPS} currentStep={currentStep} />
        </div>

        {currentStep === 0 && <AccountStep initialData={signupData} onNext={goNext} />}

        {/* TODO: 2~4단계 화면으로 교체 */}
        {currentStep > 0 && (
          <div style={{ textAlign: 'center' }}>
            <p>{currentStep + 1}단계 준비 중</p>
            <button type="button" onClick={goPrev}>
              이전
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignupPage;
