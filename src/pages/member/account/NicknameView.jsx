import { ActionErrorLine } from '../../../components/common/ActionError';
import AccountLayout from './AccountLayout';
import { CardTitle, CheckLine, SideButton, SubmitButton } from './AccountUi';
import { inputClass } from './accountStyle';

// 시안 06-5-1 닉네임 변경
// props: currentNickname, nickname, onNicknameChange, onCheck, checkState('idle'|'checking'|'available'),
//        checkError, canSubmit, isSubmitting, onSubmit, submitError
function NicknameView({
  currentNickname,
  nickname,
  onNicknameChange,
  onCheck,
  checkState = 'idle',
  checkError,
  canSubmit,
  isSubmitting,
  onSubmit,
  submitError,
}) {
  return (
    <AccountLayout active="nickname">
      <CardTitle title="닉네임 변경" />
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#111827]">현재 닉네임</span>
        <input type="text" value={currentNickname} placeholder="" readOnly className={inputClass('bg-[#f3f4f6] text-[#4b5563]')} />
      </label>
      <div className="space-y-2">
        <span className="text-sm font-bold text-[#111827]">새 닉네임</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={nickname}
            placeholder="새 닉네임"
            maxLength={8}
            aria-label="새 닉네임"
            className={inputClass('flex-1')}
            onChange={(event) => onNicknameChange(event.target.value)}
          />
          <SideButton variant={checkState === 'checking' ? 'disabled' : 'outline'} onClick={onCheck}>
            중복 확인
          </SideButton>
        </div>
        {checkState === 'available' && <CheckLine>쓸 수 있는 닉네임이에요</CheckLine>}
        <ActionErrorLine message={checkError} className="" />
        <p className="text-[13px] text-[#6b7280]">2 ~ 8자 한글 · 영문 · 숫자 · 다른 회원과 같은 닉네임은 쓸 수 없어요</p>
      </div>
      <div>
        <SubmitButton disabled={!canSubmit || isSubmitting} onClick={onSubmit}>
          변경하기
        </SubmitButton>
        <ActionErrorLine message={submitError} />
      </div>
    </AccountLayout>
  );
}

export default NicknameView;
