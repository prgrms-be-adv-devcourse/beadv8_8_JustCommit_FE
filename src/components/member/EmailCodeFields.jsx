import { AuthInput, CODE_RULE_TEXT, CodeInput, FieldHint, FieldLabel, FieldMessage, SideButton } from './AuthField';

// 이메일 + 인증번호 칸 (useEmailCode 결과를 그대로 받음)
// variant
//   plain : 비밀번호 재설정 06-2-1 (확인 버튼은 카드 아래, 남은 시간 04:32)
//   signup: 회원가입 06-3-1 ~ 4 (인증번호 옆 확인 버튼, 남은 시간 4:59, 보냄 문구에 체크 아이콘)
//           06-3-10 인증번호 폐기: 인증번호 칸 · 확인 버튼을 막고 남은 시간을 숨김
//
// emailCode: { email, status, sendMessage, code, codeMessage, remaining, isCodeVisible, isCodeDiscarded, sendButton }
// on: { emailChange, send, codeChange, verify }

function formatRemaining(seconds, padMinutes) {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return `${padMinutes ? String(minutes).padStart(2, '0') : minutes}:${rest}`;
}

function SendMessage({ message, variant }) {
  if (!message) return null;
  if (variant === 'plain' && message.type === 'success') {
    return <p className="text-[13px] font-medium text-[#0f4c3a]">{message.text}</p>;
  }
  return <FieldMessage message={message} />;
}

function EmailCodeFields({ variant = 'plain', emailCode, on }) {
  const isSignup = variant === 'signup';
  const emailState = emailCode.sendMessage?.type === 'error' ? 'error' : 'default';
  const codeState = emailCode.codeMessage ? 'error' : emailCode.code.length > 0 && isSignup ? 'success' : 'default';

  return (
    <>
      <div className="space-y-2">
        <FieldLabel>이메일</FieldLabel>
        <div className="flex gap-2">
          <AuthInput
            type={isSignup ? 'text' : 'email'}
            placeholder={isSignup ? 'name@example.com' : undefined}
            autoComplete="email"
            state={emailState}
            extra="flex-1"
            value={emailCode.email}
            onChange={(event) => on.emailChange(event.target.value)}
          />
          <SideButton variant={emailCode.sendButton.variant} onClick={on.send}>
            {emailCode.sendButton.label}
          </SideButton>
        </div>
        <SendMessage message={emailCode.sendMessage} variant={variant} />
      </div>
      {emailCode.isCodeVisible && (
        <div className="space-y-2">
          <FieldLabel>인증번호</FieldLabel>
          <div className="flex gap-2">
            <CodeInput
              state={codeState}
              extra={emailCode.isCodeDiscarded ? 'bg-[#f9fafb]' : ''}
              remainingText={emailCode.isCodeDiscarded ? null : formatRemaining(emailCode.remaining, !isSignup)}
              disabled={emailCode.isCodeDiscarded}
              value={emailCode.code}
              onChange={(event) => on.codeChange(event.target.value)}
            />
            {isSignup && (
              <SideButton variant={emailCode.isCodeDiscarded ? 'disabled' : 'primary'} onClick={on.verify}>
                확인
              </SideButton>
            )}
          </div>
          <FieldMessage message={emailCode.codeMessage} />
          {!(isSignup && emailCode.codeMessage) && <FieldHint>{CODE_RULE_TEXT}</FieldHint>}
        </div>
      )}
    </>
  );
}

export default EmailCodeFields;
