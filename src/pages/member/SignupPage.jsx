import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { registerSeller, sendEmailCode, verifyEmailCode } from '../../api/memberApi';
import useAuth from '../../hooks/useAuth';
import useEmailCode from '../../hooks/useEmailCode';
import usePageTitle from '../../hooks/usePageTitle';
import {
  SignupDoneView,
  SignupEmailView,
  SignupInfoView,
  SignupSellerView,
} from './signup/SignupViews';
import { TERMS_REQUIRED_MESSAGE } from './signup/memberRules';
import useMemberInfoForm from './signup/useMemberInfoForm';

// 시안 06-3-1 ~ 06-3-8 이메일 회원가입
// 1 이메일 인증 → 2 정보 입력 → 3 판매자 등록 (선택) → 가입 완료
const STEP = { EMAIL: 0, INFO: 1, SELLER: 2, DONE: 3 };

function getMessage(error, fallback) {
  return error.response?.data?.message ?? fallback;
}

function SignupPage() {
  usePageTitle('회원가입');
  const { isLoggedIn, signup, login, refreshUser } = useAuth();
  const [step, setStep] = useState(STEP.EMAIL);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const emailCode = useEmailCode({ sendCode: sendEmailCode, verifyCode: verifyEmailCode });
  const info = useMemberInfoForm({ withPassword: true });
  const [infoError, setInfoError] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [role, setRole] = useState('seller');
  const [intro, setIntro] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doneError, setDoneError] = useState('');

  // 이미 로그인한 사용자는 홈으로 (판매자 등록 때문에 가입 중 로그인되는 경우는 제외)
  if (isLoggedIn && step === STEP.EMAIL) {
    return <Navigate to="/" replace />;
  }

  const goStep = (next) => {
    setStep(next);
    window.scrollTo(0, 0);
  };

  if (step === STEP.EMAIL) {
    return (
      <SignupEmailView
        emailCode={emailCode}
        on={{
          emailChange: emailCode.setEmail,
          send: emailCode.send,
          codeChange: emailCode.setCode,
          verify: () =>
            emailCode.verify(() => {
              setVerifiedEmail(emailCode.email.trim());
              goStep(STEP.INFO);
            }),
        }}
      />
    );
  }

  if (step === STEP.INFO) {
    const handleNext = () => {
      // 체크해야 다음으로 넘어감
      const problem = info.validate() ?? (termsAgreed ? null : TERMS_REQUIRED_MESSAGE);
      setInfoError(problem ?? '');
      if (!problem) goStep(STEP.SELLER);
    };
    return (
      <SignupInfoView
        email={verifiedEmail}
        form={info.form}
        on={info.on}
        termsAgreed={termsAgreed}
        onTermsChange={setTermsAgreed}
        onNext={handleNext}
        error={infoError}
      />
    );
  }

  if (step === STEP.SELLER) {
    const isSeller = role === 'seller';

    // 가입 → (판매자면) 로그인 → 판매자 등록 → 가입 완료 화면
    // 가입 API는 토큰을 주지 않고, 판매자 등록은 로그인이 필요하므로 판매자를 고른 경우에만 로그인합니다.
    // TODO(member): 가입 요청에 판매자 등록(소개 · 동의)을 함께 받으면 로그인 없이 한 번에 끝낼 수 있음
    const handleSubmit = async () => {
      if (isSubmitting) return;
      if (isSeller && !agreed) {
        setSubmitError('상품 사진 외부 전송 · 학습 이용에 동의해야 판매자로 등록할 수 있어요');
        return;
      }

      setSubmitError('');
      setIsSubmitting(true);
      try {
        // TODO(member): 가입 요청에 이용약관 · 개인정보처리방침 동의 필드가 없음. 생기면 termsAgreed(· 약관 버전)를 함께 보냄
        await signup({ email: verifiedEmail, password: info.password, ...info.toProfileRequest() });
      } catch (error) {
        setSubmitError(getMessage(error, '가입하지 못했어요. 잠시 후 다시 시도해 주세요.'));
        setIsSubmitting(false);
        return;
      }

      if (isSeller) {
        try {
          await login({ email: verifiedEmail, password: info.password });
          await registerSeller(intro.trim());
          await refreshUser();
        } catch {
          setDoneError('가입은 끝났지만 판매자 등록을 하지 못했어요. 로그인한 뒤 마이페이지에서 다시 등록해 주세요.');
        }
      }
      setIsSubmitting(false);
      goStep(STEP.DONE);
    };

    return (
      <SignupSellerView
        role={role}
        intro={intro}
        agreed={agreed}
        on={{ roleChange: setRole, introChange: setIntro, agreedChange: setAgreed }}
        onPrev={() => goStep(STEP.INFO)}
        onSubmit={handleSubmit}
        error={submitError}
        isSubmitting={isSubmitting}
      />
    );
  }

  // 판매자 등록으로 이미 로그인됐다면 「로그인하러 가기」는 홈으로 보냄
  return <SignupDoneView nickname={info.nickname} to={isLoggedIn ? '/' : '/login'} error={doneError} />;
}

export default SignupPage;
