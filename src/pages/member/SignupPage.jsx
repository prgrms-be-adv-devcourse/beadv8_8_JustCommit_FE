import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getSellerConsentPolicy, registerSeller, sendEmailCode, verifyEmailCode } from '../../api/memberApi';
import useAuth from '../../hooks/useAuth';
import useEmailCode from '../../hooks/useEmailCode';
import usePageTitle from '../../hooks/usePageTitle';
import useSellerConsentPolicy from '../../hooks/useSellerConsentPolicy';
import {
  SignupDoneView,
  SignupEmailView,
  SignupInfoView,
  SignupSellerView,
} from './signup/SignupViews';
import { TERMS_REQUIRED_MESSAGE } from './signup/memberRules';
import useMemberInfoForm from './signup/useMemberInfoForm';

// 시안 06-3-1 ~ 06-3-9 이메일 회원가입
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
  // 가입 중에는 로그인 전이라 동의 문구 API를 부르지 않고 시안 문구를 보여 줌
  const consentPolicy = useSellerConsentPolicy(false);
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
    // 가입 API는 토큰을 주지 않으므로 가입 직후 바로 로그인합니다 (구매자 · 판매자 모두). 판매자 등록은 그 뒤에 이어서 합니다.
    // TODO(member): 가입 요청에 판매자 등록(소개 · 동의)을 함께 받으면 로그인 없이 한 번에 끝낼 수 있음
    const handleSubmit = async () => {
      if (isSubmitting) return;
      if (isSeller && !agreed) {
        setSubmitError('상품 검수 동의에 체크해야 판매자로 등록할 수 있어요');
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

      let isAutoLoggedIn = false;
      try {
        await login({ email: verifiedEmail, password: info.password });
        isAutoLoggedIn = true;
      } catch {
        // 자동 로그인 실패: 가입은 끝났으므로 완료 화면의 「로그인하러 가기」로 직접 로그인
      }

      if (isSeller && !isAutoLoggedIn) {
        setDoneError('가입은 끝났지만 판매자 등록을 하지 못했어요. 로그인한 뒤 마이페이지에서 다시 등록해 주세요.');
      } else if (isSeller) {
        try {
          // 로그인한 뒤 현재 동의 문구 버전을 받아 함께 보냄
          const policyResponse = await getSellerConsentPolicy();
          await registerSeller(intro.trim(), policyResponse.data.data?.version);
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
        consentPolicy={consentPolicy}
        on={{ roleChange: setRole, introChange: setIntro, agreedChange: setAgreed }}
        onPrev={() => goStep(STEP.INFO)}
        onSubmit={handleSubmit}
        error={submitError}
        isSubmitting={isSubmitting}
      />
    );
  }

  // 가입 직후 자동 로그인됐으면 홈으로, 자동 로그인에 실패했으면 로그인 화면으로 보냄
  return <SignupDoneView nickname={info.nickname} to={isLoggedIn ? '/' : '/login'} error={doneError} />;
}

export default SignupPage;
