import { ActionErrorLine } from '../../../components/common/ActionError';
import { AuthCardPage, AuthHeading, FieldHint, LabeledInput, SubmitButton } from '../../../components/member/AuthField';
import EmailCodeFields from '../../../components/member/EmailCodeFields';

// 시안 06-2-1 비밀번호 재설정 1/2 (이메일 인증)
export function ResetPasswordView({ emailCode, on, onSubmit }) {
  return (
    <AuthCardPage backTo="/login">
      <AuthHeading step="1 / 2 · 이메일 인증" title="비밀번호 재설정" description="가입한 이메일을 입력하면 인증번호를 보내 드려요." />
      <EmailCodeFields variant="plain" emailCode={emailCode} on={on} />
      <SubmitButton type="button" onClick={onSubmit}>
        다음
      </SubmitButton>
    </AuthCardPage>
  );
}

// 시안 06-2-2 비밀번호 재설정 2/2 (새 비밀번호)
// password · confirm: 입력값, passwordState · confirmState: default | error, error: 바꾸기 실패 문구
export function ResetPasswordNewView({ email, password, confirm, passwordState, confirmState, on, onSubmit, error, isSubmitting }) {
  return (
    <AuthCardPage backTo="/login">
      <AuthHeading
        step="2 / 2 · 새 비밀번호"
        title="비밀번호 재설정"
        description={`${email} 계정의 비밀번호를 새로 정해 주세요.`}
        relaxed={false}
      />
      <form id="reset-password-form" className="space-y-4" onSubmit={onSubmit} noValidate>
        <LabeledInput
          label="새 비밀번호"
          type="password"
          placeholder="새 비밀번호"
          autoComplete="new-password"
          state={passwordState}
          value={password}
          onChange={(event) => on.passwordChange(event.target.value)}
        />
        <FieldHint className="-mt-2">8 ~ 20자 · 영문 · 숫자 포함</FieldHint>
        <LabeledInput
          label="새 비밀번호 확인"
          type="password"
          placeholder="한 번 더 입력"
          autoComplete="new-password"
          state={confirmState}
          value={confirm}
          onChange={(event) => on.confirmChange(event.target.value)}
        />
      </form>
      <p className="px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] text-[13px] text-[#4b5563]">
        비밀번호를 바꾸면 로그인된 모든 기기에서 로그아웃돼요. 새 비밀번호로 다시 로그인해 주세요.
      </p>
      <div>
        <SubmitButton form="reset-password-form" disabled={isSubmitting}>
          비밀번호 바꾸기
        </SubmitButton>
        <ActionErrorLine message={error} />
      </div>
    </AuthCardPage>
  );
}
