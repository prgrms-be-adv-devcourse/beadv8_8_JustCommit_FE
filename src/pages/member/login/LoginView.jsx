import { Link } from 'react-router-dom';
import {
  AlertIcon,
  AuthCardPage,
  LabeledInput,
  SubmitButton,
} from '../../../components/member/AuthField';

// 시안 06-1-1 로그인 · 06-1-2 로그인 실패 · 06-1-3 카카오 이메일 중복 · 06-1-4 카카오 이메일 동의 필요

// 위쪽 안내 상자: error(빨강, 06-1-3) · warning(노랑, 06-1-4)
const NOTICE_CLASS = {
  error: 'px-4 py-3 border bg-[#fef2f2] border-[#fecaca] text-[#b91c1c] flex gap-2 text-sm leading-relaxed',
  warning: 'px-4 py-3 border bg-[#fffbeb] border-[#fde68a] text-[#92400e] flex gap-2 text-sm leading-relaxed',
};

function KakaoButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full h-12 flex items-center justify-center bg-[#FEE500] text-[#191919] text-[15px] font-bold"
    >
      <span className="absolute left-4">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#191919">
          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.86 5.32 4.66 6.74l-.95 3.52a.4.4 0 00.6.44l4.1-2.72c.52.07 1.05.11 1.59.11 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
        </svg>
      </span>
      카카오로 시작하기
    </button>
  );
}

// notice: { type: 'error' | 'warning', text } | null
// error: { text, highlight } | null  (highlight: 두 입력칸을 빨갛게, 06-1-2)
function LoginView({ email, password, onEmailChange, onPasswordChange, onSubmit, onKakao, notice, error, isSubmitting }) {
  const inputState = error?.highlight ? 'error' : 'default';

  return (
    <AuthCardPage>
      <h1 className="text-2xl font-bold text-[#111827] tracking-tight">로그인</h1>
      {notice && (
        <div role="alert" className={NOTICE_CLASS[notice.type]}>
          <AlertIcon />
          <span>{notice.text}</span>
        </div>
      )}
      <form id="login-form" className="space-y-4" onSubmit={onSubmit} noValidate>
        <LabeledInput
          label="이메일"
          type="email"
          name="email"
          placeholder="name@example.com"
          autoComplete="email"
          state={inputState}
          value={email}
          onChange={onEmailChange}
        />
        <div className="space-y-2">
          <LabeledInput
            label="비밀번호"
            type="password"
            name="password"
            placeholder="비밀번호"
            autoComplete="current-password"
            state={inputState}
            value={password}
            onChange={onPasswordChange}
          />
          {error && (
            <p role="alert" className="flex items-center gap-1.5 text-[13px] font-medium text-[#b91c1c]">
              <AlertIcon />
              {error.text}
            </p>
          )}
        </div>
      </form>
      <div className="flex justify-end gap-3 text-[13px] text-[#4b5563]">
        <Link to="/find-id" className="hover:underline">아이디 찾기</Link>
        <span className="text-[#d1d5db]">|</span>
        <Link to="/reset-password" className="hover:underline">비밀번호 재설정</Link>
      </div>
      <SubmitButton form="login-form" disabled={isSubmitting}>로그인</SubmitButton>
      <div className="flex items-center gap-3 text-[13px] text-[#9ca3af]">
        <span className="flex-1 h-px bg-[#e5e7eb]" />
        또는
        <span className="flex-1 h-px bg-[#e5e7eb]" />
      </div>
      <div className="space-y-2.5">
        <KakaoButton onClick={onKakao} />
      </div>
      <p className="text-center text-sm text-[#4b5563]">
        {'아직 회원이 아니신가요? '}
        <Link to="/signup" className="ml-1 font-bold text-[#0f4c3a] underline">회원가입</Link>
      </p>
    </AuthCardPage>
  );
}

export default LoginView;
