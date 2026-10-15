import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Stepper from '../../components/common/Stepper';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import ProfileStep from './signup/ProfileStep';
import BankStep from './signup/BankStep';
import SellerStep from './signup/SellerStep';
import styles from './SignupPage.module.css';

export const SIGNUP_TOKEN_KEY = 'socialSignupToken';

const SOCIAL_SIGNUP_STEPS = [
  { title: '기본 정보', icon: 'potted_plant', description: '대기' },
  { title: '계좌 등록', icon: 'account_balance', description: '대기' },
  { title: '판매자 등록', icon: 'storefront', description: '선택' },
];

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

function SocialSignupPage() {
  usePageTitle('카카오 회원가입');
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const signupToken = useSignupToken();
  const [currentStep, setCurrentStep] = useState(0);
  const [signupData, setSignupData] = useState({});

  if (isLoggedIn && currentStep === 0) {
    return <Navigate to="/" replace />;
  }

  if (!signupToken) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ errorMessage: '가입 정보가 없습니다. 카카오 로그인을 다시 진행해 주세요.' }}
      />
    );
  }

  const goNext = (stepData) => {
    setSignupData((prev) => ({ ...prev, ...stepData }));
    setCurrentStep((step) => step + 1);
    window.scrollTo(0, 0);
  };

  const goPrev = () => {
    if (currentStep === 0) {
      sessionStorage.removeItem(SIGNUP_TOKEN_KEY);
      navigate('/login', { replace: true });
      return;
    }
    setCurrentStep((step) => step - 1);
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
          <Stepper steps={SOCIAL_SIGNUP_STEPS} currentStep={currentStep} />
        </div>

        {currentStep === 0 && (
          <ProfileStep initialData={signupData} onNext={goNext} onPrev={goPrev} />
        )}
        {currentStep === 1 && (
          <BankStep initialData={signupData} onNext={goNext} onPrev={goPrev} />
        )}
        {currentStep === 2 && (
          <SellerStep initialData={signupData} onPrev={goPrev} socialSignupToken={signupToken} />
        )}
      </div>
    </div>
  );
}

export default SocialSignupPage;
