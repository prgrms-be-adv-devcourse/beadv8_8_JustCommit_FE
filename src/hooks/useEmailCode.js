import { useState } from 'react';
import useCountdown from './useCountdown';

// 이메일 인증번호 받기 · 확인 (회원가입 06-3 · 아이디 찾기 06-2-1 · 비밀번호 재설정 06-2-3 공통)
// 규칙: 6자리 5분, 재발송 60초 뒤, 같은 이메일 하루 5회, 5번 틀리면 폐기 (BE docs/services/member.md 「정책」)
//
// sendCode(email) → 응답 data { expiresIn, resendAvailableIn }
// verifyCode({ email, code }) → 성공하면 응답 그대로 onVerified에 넘김

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const SENT_TEXT = '인증번호를 보냈어요. 메일함을 확인해 주세요.';
const EXPIRED_TEXT = '인증 시간이 지났어요. 인증번호를 다시 받아 주세요';

function getMessage(error, fallback) {
  return error.response?.data?.message ?? fallback;
}

// 인증번호 발송 실패 → { status, text }
function toSendError(error) {
  const code = error.response?.data?.code;
  if (code === 'DUPLICATE_EMAIL') {
    return { status: 'duplicate', text: '이미 가입한 이메일이에요. 로그인하거나 비밀번호를 재설정해 주세요.' };
  }
  // TODO(member): 하루 5회 제한 오류 코드가 정해지면 맞춥니다. 지금 백엔드는 재발송 60초 제한(EMAIL_SEND_COOLDOWN)만 있음
  if (code === 'EMAIL_SEND_LIMIT_EXCEEDED') {
    return { status: 'limit', text: '이 이메일은 오늘 인증번호를 5번 받았어요. 내일 다시 시도해 주세요.' };
  }
  return { status: 'error', text: getMessage(error, '인증번호를 보내지 못했어요. 잠시 후 다시 시도해 주세요.') };
}

// 인증번호 확인 실패 → 문구
function toVerifyErrorText(error) {
  const code = error.response?.data?.code;
  if (code === 'EMAIL_CODE_MISMATCH') {
    // TODO(member): 남은 횟수가 응답에 없음. data.remainingAttempts 같은 값이 생기면 넣습니다.
    const remaining = error.response?.data?.data?.remainingAttempts ?? '{남은 횟수}';
    return `인증번호가 맞지 않아요 · ${remaining}번 더 틀리면 인증번호가 폐기돼 다시 받아야 해요`;
  }
  if (code === 'EMAIL_CODE_EXPIRED') return EXPIRED_TEXT;
  return getMessage(error, '인증번호를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
}

function useEmailCode({ sendCode, verifyCode, initialEmail = '' }) {
  const [email, setEmailValue] = useState(initialEmail);
  // idle: 아직 안 보냄 · sent: 보냄 · duplicate · limit · error: 보내기 실패
  const [status, setStatus] = useState('idle');
  const [sendMessage, setSendMessage] = useState(null);
  const [code, setCodeValue] = useState('');
  const [codeMessage, setCodeMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const codeTimer = useCountdown();
  const resendTimer = useCountdown();

  const setEmail = (value) => {
    setEmailValue(value);
    if (status !== 'idle') {
      setStatus('idle');
      setSendMessage(null);
      setCode('');
      setCodeMessage(null);
      codeTimer.stop();
      resendTimer.stop();
    }
  };

  const setCode = (value) => {
    setCodeValue(value.replace(/\D/g, '').slice(0, 6));
  };

  const send = async () => {
    if (isSending || resendTimer.isRunning || status === 'limit') return;
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setStatus('error');
      setSendMessage({ type: 'error', text: '이메일 형식이 맞지 않아요' });
      return;
    }

    setIsSending(true);
    setCodeMessage(null);
    try {
      const response = await sendCode(trimmed);
      const { expiresIn = 300, resendAvailableIn = 60 } = response?.data?.data ?? {};
      codeTimer.start(expiresIn);
      resendTimer.start(resendAvailableIn);
      setStatus('sent');
      setCodeValue('');
      setSendMessage({ type: 'success', text: SENT_TEXT });
    } catch (error) {
      const { status: nextStatus, text } = toSendError(error);
      setStatus(nextStatus);
      setSendMessage({ type: 'error', text });
    } finally {
      setIsSending(false);
    }
  };

  // 성공하면 onVerified(응답) 호출
  const verify = async (onVerified) => {
    if (isVerifying) return;
    if (status !== 'sent') {
      setCodeMessage({ type: 'error', text: '먼저 인증번호를 받아 주세요' });
      return;
    }
    if (!codeTimer.isRunning) {
      setCodeMessage({ type: 'error', text: EXPIRED_TEXT });
      return;
    }
    if (code.length !== 6) {
      setCodeMessage({ type: 'error', text: '인증번호 6자리를 입력해 주세요' });
      return;
    }

    setIsVerifying(true);
    setCodeMessage(null);
    try {
      const response = await verifyCode({ email: email.trim(), code });
      codeTimer.stop();
      resendTimer.stop();
      await onVerified?.(response);
    } catch (error) {
      setCodeMessage({ type: 'error', text: toVerifyErrorText(error) });
    } finally {
      setIsVerifying(false);
    }
  };

  // 옆 버튼 모양 · 글자
  let sendButton = { variant: 'outline', label: status === 'sent' ? '다시 받기' : '인증번호 받기' };
  if (status === 'limit') sendButton = { variant: 'disabled', label: '인증번호 받기' };
  else if (isSending) sendButton = { variant: 'disabled', label: '보내는 중' };
  else if (resendTimer.isRunning) sendButton = { variant: 'disabled', label: `다시 받기 (${resendTimer.remaining}초)` };

  return {
    email,
    setEmail,
    status,
    sendMessage,
    code,
    setCode,
    codeMessage,
    remaining: codeTimer.remaining,
    isCodeVisible: status === 'sent',
    isVerifying,
    sendButton,
    send,
    verify,
  };
}

export default useEmailCode;
