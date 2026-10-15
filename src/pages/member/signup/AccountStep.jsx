import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import useCountdown from '../../../hooks/useCountdown';
import { sendEmailCode, verifyEmailCode } from '../../../api/memberApi';
import { formatTime } from '../../../utils/format';
import styles from './AccountStep.module.css';

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PASSWORD_ALLOWED_CHARS = /^[A-Za-z\d!@#$%^&*]*$/;

function getErrorMessage(error, fallback) {
  return error.response?.data?.message ?? fallback;
}

function FieldMessage({ message }) {
  if (!message) return null;

  return (
    <p className={`${styles.message} ${styles[message.type]}`}>
      <span className="material-symbols-outlined">
        {message.type === 'success' ? 'check_circle' : 'error'}
      </span>
      {message.text}
    </p>
  );
}

function AccountStep({ initialData, onNext }) {
  const [tab, setTab] = useState('local');

  const [email, setEmail] = useState(initialData.email ?? '');
  const [emailStatus, setEmailStatus] = useState(initialData.emailVerified ? 'verified' : 'idle');
  const [emailMessage, setEmailMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const [code, setCode] = useState('');
  const [codeMessage, setCodeMessage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [password, setPassword] = useState(initialData.password ?? '');
  const [passwordConfirm, setPasswordConfirm] = useState(initialData.password ?? '');
  const [agreed, setAgreed] = useState(initialData.agreed ?? false);

  const codeTimer = useCountdown();
  const resendTimer = useCountdown();

  const isEmailVerified = emailStatus === 'verified';

  const passwordRules = [
    { label: '8~20자', passed: password.length >= 8 && password.length <= 20 },
    { label: '영문 포함', passed: /[A-Za-z]/.test(password) },
    { label: '숫자 포함', passed: /\d/.test(password) },
  ];
  const hasInvalidChar = !PASSWORD_ALLOWED_CHARS.test(password);
  const isPasswordValid = passwordRules.every((rule) => rule.passed) && !hasInvalidChar;
  const isPasswordMatch = passwordConfirm.length > 0 && password === passwordConfirm;

  const canProceed = isEmailVerified && isPasswordValid && isPasswordMatch && agreed;

  const getSendButtonText = () => {
    if (isEmailVerified) return '인증 완료';
    if (isSending) return '발송 중...';
    if (resendTimer.isRunning) return `재발송 ${resendTimer.remaining}초`;
    if (emailStatus === 'sent') return '재발송';
    return '인증번호 받기';
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);

    if (emailStatus !== 'idle') {
      setEmailStatus('idle');
      setCode('');
      setEmailMessage(null);
      setCodeMessage(null);
      codeTimer.stop();
      resendTimer.stop();
    }
  };

  const handleSendCode = async () => {
    if (!EMAIL_REGEX.test(email)) {
      setEmailMessage({ type: 'error', text: '이메일 형식이 올바르지 않습니다.' });
      return;
    }

    setIsSending(true);
    setEmailMessage(null);
    setCodeMessage(null);

    try {
      const response = await sendEmailCode(email);
      const { expiresIn, resendAvailableIn } = response.data.data;

      codeTimer.start(expiresIn);
      resendTimer.start(resendAvailableIn);
      setEmailStatus('sent');
      setCode('');
      setEmailMessage({
        type: 'success',
        text: `인증번호를 발송했습니다. ${Math.floor(expiresIn / 60)}분 안에 입력해 주세요.`,
      });
    } catch (error) {
      setEmailMessage({
        type: 'error',
        text: getErrorMessage(error, '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCodeChange = (event) => {
    setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
  };

  const handleVerifyCode = async () => {
    if (!codeTimer.isRunning) {
      setCodeMessage({ type: 'error', text: '인증 시간이 만료되었습니다. 인증번호를 다시 받아 주세요.' });
      return;
    }

    setIsVerifying(true);
    setCodeMessage(null);

    try {
      await verifyEmailCode({ email, code });
      setEmailStatus('verified');
      codeTimer.stop();
      resendTimer.stop();
      setEmailMessage({ type: 'success', text: '이메일 인증이 완료되었습니다.' });
    } catch (error) {
      setCodeMessage({
        type: 'error',
        text: getErrorMessage(error, '인증번호 확인에 실패했습니다.'),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canProceed) return;

    onNext({ email, password, emailVerified: true, agreed });
  };

  const handleKakaoSignup = () => {
    // TODO: #102 카카오 로그인 연동 후 소셜 가입 흐름 연결
    alert('카카오 가입은 준비 중입니다.');
  };

  return (
    <section className={styles.card}>
      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'local'}
          className={`${styles.tab} ${tab === 'local' ? styles.activeTab : ''}`}
          onClick={() => setTab('local')}
        >
          <span className="material-symbols-outlined">mail</span>
          이메일 직접 가입
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'social'}
          className={`${styles.tab} ${tab === 'social' ? styles.activeTab : ''}`}
          onClick={() => setTab('social')}
        >
          <span className="material-symbols-outlined">share</span>
          소셜 간편 연동 가입
        </button>
      </div>

      {tab === 'local' ? (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div>
            <h2 className={styles.title}>이메일 계정 및 비밀번호 설정</h2>
            <p className={styles.subtitle}>자주 사용하는 이메일 주소로 인증번호를 전송합니다.</p>
          </div>

          <div className={styles.field}>
            <label htmlFor="signup-email" className={styles.label}>
              이메일 주소 <span className={styles.required}>*</span>
            </label>
            <div className={styles.row}>
              <input
                id="signup-email"
                type="email"
                className={styles.input}
                placeholder="example@replant.kr"
                value={email}
                onChange={handleEmailChange}
                disabled={isEmailVerified}
                autoComplete="email"
              />
              <Button
                className={styles.sideButton}
                onClick={handleSendCode}
                disabled={!email || isSending || isEmailVerified || resendTimer.isRunning}
              >
                {getSendButtonText()}
              </Button>
            </div>
            <FieldMessage message={emailMessage} />
          </div>

          {emailStatus === 'sent' && (
            <div className={styles.codeBox}>
              <div className={styles.codeHeader}>
                <label htmlFor="signup-code" className={styles.label}>
                  인증번호 6자리 입력
                </label>
                <span className={styles.timer}>
                  <span className="material-symbols-outlined">timer</span>
                  {codeTimer.isRunning ? formatTime(codeTimer.remaining) : '00:00 (만료)'}
                </span>
              </div>
              <div className={styles.row}>
                <input
                  id="signup-code"
                  inputMode="numeric"
                  className={`${styles.input} ${styles.codeInput}`}
                  placeholder="인증번호 6자리"
                  value={code}
                  onChange={handleCodeChange}
                  autoComplete="one-time-code"
                />
                <Button
                  className={styles.sideButton}
                  onClick={handleVerifyCode}
                  disabled={code.length !== 6 || isVerifying}
                >
                  {isVerifying ? '확인 중...' : '확인'}
                </Button>
              </div>
              <FieldMessage message={codeMessage} />
            </div>
          )}

          <div className={styles.field}>
            <Input
              id="signup-password"
              label="비밀번호"
              type="password"
              placeholder="영문, 숫자 포함 8~20자"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              error={hasInvalidChar ? '특수문자는 !@#$%^&*만 사용할 수 있습니다.' : undefined}
            />
            <ul className={styles.rules}>
              {passwordRules.map((rule) => (
                <li key={rule.label} className={rule.passed ? styles.rulePassed : ''}>
                  <span className="material-symbols-outlined">check</span>
                  {rule.label}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.field}>
            <Input
              id="signup-password-confirm"
              label="비밀번호 확인"
              type="password"
              placeholder="비밀번호를 한 번 더 입력하세요"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              autoComplete="new-password"
              error={passwordConfirm && !isPasswordMatch ? '비밀번호가 일치하지 않습니다.' : undefined}
            />
            {isPasswordMatch && (
              <FieldMessage message={{ type: 'success', text: '비밀번호가 일치합니다.' }} />
            )}
          </div>

          <label className={styles.terms}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            <span className={styles.termsText}>
              [필수] replant 회원가입 및 전자금융거래 이용약관 동의
              <span className={styles.termsDesc}>
                반려식물 안전 에스크로 거래 및 분쟁 조정 규정에 동의합니다.
              </span>
            </span>
          </label>

          <Button
            type="submit"
            fullWidth
            disabled={!canProceed}
            rightIcon="arrow_forward"
            className={styles.nextButton}
          >
            다음 단계로 (기본 정보 입력)
          </Button>

          <p className={styles.loginLink}>
            이미 계정이 있으신가요?
            <Link to="/login">로그인</Link>
          </p>
        </form>
      ) : (
        <div className={styles.form}>
          <div>
            <h2 className={styles.title}>카카오 계정으로 가입</h2>
            <p className={styles.subtitle}>카카오 계정으로 간편하게 가입할 수 있습니다.</p>
          </div>
          <Button variant="kakao" fullWidth onClick={handleKakaoSignup}>
            카카오로 시작하기
          </Button>
        </div>
      )}
    </section>
  );
}

export default AccountStep;
