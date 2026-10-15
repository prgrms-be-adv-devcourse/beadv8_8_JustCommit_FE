import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Stepper from '../../components/common/Stepper';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import AccountStep from './signup/AccountStep';
import ProfileStep from './signup/ProfileStep';
import BankStep from './signup/BankStep';
import SellerStep from './signup/SellerStep';
import styles from './SignupPage.module.css';

const SIGNUP_STEPS = [
  { title: '계정 인증', icon: 'mail', description: '대기' },
  { title: '기본 정보', icon: 'potted_plant', description: '대기' },
  { title: '계좌 등록', icon: 'account_balance', description: '대기' },
  { title: '판매자 등록', icon: 'storefront', description: '선택' },
];

function SignupPage() {
  usePageTitle('회원가입');
  const { isLoggedIn } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [signupData, setSignupData] = useState({});

  // 이미 로그인한 사용자는 홈으로 (4단계에서 가입 직후 로그인되는 경우는 제외)
  if (isLoggedIn && currentStep === 0) {
    return <Navigate to="/" replace />;
  }

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
        {currentStep === 1 && (
          <ProfileStep initialData={signupData} onNext={goNext} onPrev={goPrev} />
        )}
        {currentStep === 2 && (
          <BankStep initialData={signupData} onNext={goNext} onPrev={goPrev} />
        )}
        {currentStep === 3 && <SellerStep initialData={signupData} onPrev={goPrev} />}
      </div>
    </div>
  );
}

export default SignupPage;
