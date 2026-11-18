import { Link } from 'react-router-dom';
import { ActionErrorLine } from '../../../components/common/ActionError';
import Modal from '../../../components/common/Modal';
import ModalButton from '../../../components/common/ModalButton';
import { AlertIcon } from '../../../components/member/AuthField';
import AccountLayout from './AccountLayout';
import { CardTitle, InfoNote, SubmitButton } from './AccountUi';
import { inputClass } from './accountStyle';

// 시안 06-5-2 비밀번호 변경 · 06-5-3 5번 틀려 잠김 · 06-5-4 변경 완료 모달
// (카카오 가입 회원은 메뉴에서 이 탭이 빠지고, PasswordPage가 닉네임 변경으로 보냄)
// props: form{currentPassword,newPassword,confirmPassword}, onChange(name, value),
//        currentPasswordError(빨간 줄), isLocked(06-5-3: 빨간 줄 + 비밀번호 재설정 안내, 버튼 막힘),
//        newPasswordError, confirmError, canSubmit, isSubmitting, onSubmit, submitError, isDone, onLogin
const LOCKED_TEXT = '현재 비밀번호를 5번 틀려서 24시간 동안 비밀번호를 바꿀 수 없어요';

function PasswordField({ label, name, value, placeholder, onChange, help, error, alert }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <input
        type="password"
        value={value}
        placeholder={placeholder}
        className={inputClass('', alert ? 'border-[#b91c1c]' : undefined)}
        autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {alert}
      {error ? <ActionErrorLine message={error} className="" /> : help}
    </label>
  );
}

// 칸 아래 빨간 줄 (아이콘 포함)
function AlertLine({ children }) {
  return (
    <p role="alert" className="flex items-center gap-1.5 text-[13px] font-medium text-[#b91c1c]">
      <AlertIcon />
      {children}
    </p>
  );
}

function PasswordView({
  form,
  currentPasswordError,
  isLocked,
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
  return (
    <>
      <AccountLayout active="password">
        <CardTitle title="비밀번호 변경" />
        <PasswordField
          label="현재 비밀번호"
          name="currentPassword"
          value={form.currentPassword}
          placeholder="현재 비밀번호"
          onChange={onChange}
          alert={(isLocked || currentPasswordError) && <AlertLine>{isLocked ? LOCKED_TEXT : currentPasswordError}</AlertLine>}
          help={
            isLocked && (
              <p className="text-[13px] text-[#4b5563]">
                {'비밀번호가 기억나지 않으면 '}
                <Link to="/reset-password" className="font-semibold text-[#0f4c3a] underline">
                  비밀번호 재설정
                </Link>
                으로 바꿀 수 있어요.
              </p>
            )
          }
        />
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
          <SubmitButton disabled={!canSubmit || isSubmitting || isLocked} onClick={onSubmit}>
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
