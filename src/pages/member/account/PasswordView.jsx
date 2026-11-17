import { ActionErrorLine } from '../../../components/common/ActionError';
import Modal from '../../../components/common/Modal';
import ModalButton from '../../../components/common/ModalButton';
import AccountLayout from './AccountLayout';
import { CardTitle, InfoNote, SubmitButton } from './AccountUi';
import { inputClass } from './accountStyle';

// 시안 06-5-2 비밀번호 변경 · 06-5-3 변경 완료 모달 · 06-5-4 소셜 가입 회원
// props: isSocial, form{currentPassword,newPassword,confirmPassword}, onChange(name, value),
//        newPasswordError, confirmError, canSubmit, isSubmitting, onSubmit, submitError, isDone, onLogin
function PasswordField({ label, name, value, placeholder, onChange, help, error }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <input
        type="password"
        value={value}
        placeholder={placeholder}
        className={inputClass()}
        autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {error ? <ActionErrorLine message={error} className="" /> : help}
    </label>
  );
}

function PasswordView({
  isSocial,
  form,
  onChange,
  newPasswordError,
  confirmError,
  canSubmit,
  isSubmitting,
  onSubmit,
  submitError,
  isDone,
  onLogin,
}) {
  if (isSocial) {
    return (
      <AccountLayout active="password">
        <CardTitle title="비밀번호 변경" />
        <div className="p-5 bg-[#f9fafb] border border-[#e5e7eb] flex items-center gap-4">
          <span className="w-10 h-10 flex items-center justify-center bg-[#FEE500] shrink-0">
            <svg className="w-5 h-5 text-[#191919]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.9 5.36 4.75 6.77l-.97 3.55c-.09.33.29.59.57.4L10.5 19.2c.49.05.99.08 1.5.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
            </svg>
          </span>
          <div className="space-y-1">
            <p className="text-[15px] font-bold text-[#111827]">카카오로 가입한 계정은 비밀번호가 없어요</p>
            <p className="text-[13px] text-[#4b5563]">카카오 로그인으로 들어와 주세요.</p>
          </div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <>
      <AccountLayout active="password">
        <CardTitle title="비밀번호 변경" />
        <PasswordField label="현재 비밀번호" name="currentPassword" value={form.currentPassword} placeholder="현재 비밀번호" onChange={onChange} />
        <PasswordField
          label="새 비밀번호"
          name="newPassword"
          value={form.newPassword}
          placeholder="새 비밀번호"
          onChange={onChange}
          error={newPasswordError}
          help={<p className="text-[13px] text-[#6b7280]">8 ~ 20자 · 영문 · 숫자 포함</p>}
        />
        <PasswordField
          label="새 비밀번호 확인"
          name="confirmPassword"
          value={form.confirmPassword}
          placeholder="새 비밀번호 다시 입력"
          onChange={onChange}
          error={confirmError}
        />
        <InfoNote>
          비밀번호를 바꾸면 <b>모든 기기에서 로그아웃</b>돼요. 새 비밀번호로 다시 로그인해 주세요.
        </InfoNote>
        <div>
          <SubmitButton disabled={!canSubmit || isSubmitting} onClick={onSubmit}>
            변경하기
          </SubmitButton>
          <ActionErrorLine message={submitError} />
        </div>
      </AccountLayout>
      {isDone && (
        <Modal
          title="비밀번호를 바꿨어요"
          width={440}
          onClose={onLogin}
          footer={
            <ModalButton variant="primary" onClick={onLogin}>
              로그인하기
            </ModalButton>
          }
        >
          <p className="text-[#4b5563] leading-relaxed">모든 기기에서 로그아웃됐어요. 새 비밀번호로 다시 로그인해 주세요.</p>
        </Modal>
      )}
    </>
  );
}

export default PasswordView;
