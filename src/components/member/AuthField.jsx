import authInputClass from './authInputClass';
import PageBackLink from '../common/PageBackLink';

// 06 회원 (로그인 · 비밀번호 재설정 · 회원가입) 시안의 입력칸 · 안내 문구 · 버튼 모음
// 여러 화면에서 같은 class로 반복되므로 여기 한 곳에 둡니다.

// 입력칸 하나. state: default | error | success, extra: 시안에서 뒤에 붙는 class (flex-1, bg-[#f3f4f6] 등)
export function AuthInput({ state = 'default', extra = '', ...props }) {
  return <input className={authInputClass(state, extra)} {...props} />;
}

// 입력칸 제목
export function FieldLabel({ children }) {
  return <span className="text-sm font-bold text-[#111827]">{children}</span>;
}

// 제목 + 입력칸 (+ 안내 · 결과 문구)을 label로 묶은 기본 칸
export function LabeledInput({ label, state, extra, children, ...inputProps }) {
  return (
    <label className="block space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <AuthInput state={state} extra={extra} {...inputProps} />
      {children}
    </label>
  );
}

// 회색 안내 한 줄
export function FieldHint({ children, className = '' }) {
  return <p className={className ? `${className} text-[13px] text-[#6b7280]` : 'text-[13px] text-[#6b7280]'}>{children}</p>;
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function AlertIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// 결과 문구 (아이콘 포함). message: { type: 'success' | 'error', text } 또는 null
export function FieldMessage({ message }) {
  if (!message) return null;
  const isError = message.type === 'error';
  return (
    <p
      role={isError ? 'alert' : undefined}
      className={`flex items-center gap-1.5 text-[13px] font-medium ${isError ? 'text-[#b91c1c]' : 'text-[#0f4c3a]'}`}
    >
      {isError ? <AlertIcon /> : <CheckIcon />}
      {message.text}
    </p>
  );
}

// 입력칸 옆 120px 버튼. variant: outline(흰 바탕 초록 테두리) | primary(초록) | disabled(회색)
const SIDE_BUTTON = {
  outline: 'h-12 w-[120px] text-sm font-semibold shrink-0 bg-white border border-[#0f4c3a] text-[#0f4c3a]',
  primary: 'h-12 w-[120px] bg-[#0f4c3a] text-white text-sm font-semibold shrink-0',
  disabled: 'h-12 w-[120px] text-sm font-semibold shrink-0 bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed',
};

export function SideButton({ variant = 'outline', children, ...props }) {
  return (
    <button type="button" disabled={variant === 'disabled'} className={SIDE_BUTTON[variant]} {...props}>
      {children}
    </button>
  );
}

// 카드 아래 꽉 찬 초록 버튼
export function SubmitButton({ children, ...props }) {
  return (
    <button type="submit" className="w-full h-12 bg-[#0f4c3a] text-white text-base font-bold" {...props}>
      {children}
    </button>
  );
}

// 인증번호 입력칸 + 오른쪽 남은 시간
export function CodeInput({ state = 'default', remainingText, ...props }) {
  return (
    <div className="relative flex-1">
      <AuthInput
        state={state}
        extra="tracking-widest"
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="6자리 숫자"
        autoComplete="one-time-code"
        {...props}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#b91c1c] tabular-nums">
        {remainingText}
      </span>
    </div>
  );
}

export const CODE_RULE_TEXT =
  '인증번호는 5분 동안 쓸 수 있어요 · 60초 뒤에 다시 받을 수 있고, 하루 5번까지 받을 수 있어요';

// 로그인 · 비밀번호 재설정 화면의 틀 (440px 카드, 위에 「‹ 로그인」 링크 선택)
export function AuthCardPage({ backTo, backLabel = '로그인', children }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 py-14 flex justify-center">
      <div className="w-full max-w-[440px] space-y-4">
        {backTo && (
          <PageBackLink to={backTo} label={backLabel} />
        )}
        <section className="bg-white border border-[#e5e7eb] p-9 space-y-6">{children}</section>
      </div>
    </main>
  );
}

// 「제목 + 설명」 머리 (설명 위 작은 단계 표시 선택)
export function AuthHeading({ step, title, description, relaxed = true }) {
  return (
    <div className="space-y-1.5">
      {step && <p className="text-xs font-bold text-[#0f4c3a]">{step}</p>}
      <h1 className="text-2xl font-bold text-[#111827] tracking-tight">{title}</h1>
      {description && (
        <p className={relaxed ? 'text-sm text-[#4b5563] leading-relaxed' : 'text-sm text-[#4b5563]'}>{description}</p>
      )}
    </div>
  );
}

// 큰 체크 아이콘 상자 (가입 완료)
export function DoneMark({ size = 'md' }) {
  const box = size === 'lg' ? 'w-16 h-16' : 'w-14 h-14';
  const icon = size === 'lg' ? 'w-8 h-8' : 'w-7 h-7';
  return (
    <div className={`${box} bg-[#f4f8f6] border border-[#d1e7dd] flex items-center justify-center`}>
      <svg className={`${icon} text-[#0f4c3a]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}
