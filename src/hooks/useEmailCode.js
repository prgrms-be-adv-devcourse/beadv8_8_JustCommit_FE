import { useState } from 'react';
import useCountdown from './useCountdown';

// 이메일 인증번호 받기 · 확인 (회원가입 06-3 · 비밀번호 재설정 06-2-1 공통)
// 규칙: 6자리 5분, 재발송 60초 뒤, 같은 이메일 하루 5회, 5번 틀리면 폐기 (BE docs/services/member.md 「정책」)
//
// sendCode(email) → 응답 data { expiresIn, resendAvailableIn }
// verifyCode({ email, code }) → 성공하면 응답 그대로 onVerified에 넘김
// sentText: 보낸 뒤 문구 (비밀번호 재설정은 가입 여부를 알리지 않는 문구)

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const SENT_TEXT = '인증번호를 보냈어요. 메일함을 확인해 주세요.';
const EXPIRED_TEXT = '인증 시간이 지났어요. 인증번호를 다시 받아 주세요';
const MISMATCH_TEXT = '인증번호가 맞지 않아요 · 5번 틀리면 인증번호가 폐기돼 다시 받아야 해요';
// 시안에 없는 문구 (5번 틀려 폐기됨)
const ATTEMPTS_EXCEEDED_TEXT = '인증번호를 5번 틀려서 폐기됐어요. 인증번호를 다시 받아 주세요';

function getMessage(error, fallback) {
  return error.response?.data?.message ?? fallback;
}

// Retry-After(남은 초) → 시간(올림). 헤더가 없으면 자리 문구
function toRetryHours(error) {
  const seconds = Number(error.response?.headers?.['retry-after']);
  if (!Number.isFinite(seconds) || seconds <= 0) return '{N}';
  return Math.ceil(seconds / 3600);
}

// 인증번호 발송 실패 → { status, text }
export function toSendError(error) {
  const code = error.response?.data?.code;
  if (code === 'DUPLICATE_EMAIL') {
    return { status: 'duplicate', text: '이미 가입한 이메일이에요. 로그인하거나 비밀번호를 재설정해 주세요.' };
  }
  // 429 EMAIL_SEND_DAILY_LIMIT + Retry-After (06-3-4)
  if (code === 'EMAIL_SEND_DAILY_LIMIT') {
    return {
      status: 'limit',
      text: `이 이메일은 인증번호를 5번 받았어요. ${toRetryHours(error)}시간 뒤에 다시 받을 수 있어요.`,
    };
  }
  return { status: 'error', text: getMessage(error, '인증번호를 보내지 못했어요. 잠시 후 다시 시도해 주세요.') };
}

// 인증번호 확인 실패 → 문구
export function toVerifyErrorText(error) {
  const code = error.response?.data?.code;
  // 가입 · 계좌 변경 (06-3-3)
  if (code === 'EMAIL_CODE_MISMATCH') return MISMATCH_TEXT;
  if (code === 'EMAIL_CODE_EXPIRED') return EXPIRED_TEXT;
  if (code === 'EMAIL_CODE_ATTEMPTS_EXCEEDED') return ATTEMPTS_EXCEEDED_TEXT;
  // 비밀번호 재설정: 틀림 · 만료 · 한도 초과를 구분하지 않음 (06-2-1)
  if (code === 'EMAIL_CODE_INVALID') return '인증번호가 맞지 않거나 만료됐어요';
  return getMessage(error, '인증번호를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
}

function useEmailCode({ sendCode, verifyCode, initialEmail = '', sentText = SENT_TEXT }) {
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
      setSendMessage({ type: 'success', text: sentText });
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
