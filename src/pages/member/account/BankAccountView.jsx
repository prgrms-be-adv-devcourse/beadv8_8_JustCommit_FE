import { ActionErrorLine } from '../../../components/common/ActionError';
import { BANKS } from '../../../constants/banks';
import AccountLayout from './AccountLayout';
import { CardTitle, CheckLine, InfoNote, SideButton, SubmitButton } from './AccountUi';
import { inputClass } from './accountStyle';

// 시안 06-5-5 계좌 변경 (이메일 인증) · 06-5-6 계좌 입력
// props
//   currentAccount: '국민은행 ***4567 · 예금주 김*식'
//   isVerified: 인증을 마쳤으면 계좌 입력 화면
//   인증: email, codeSent, resendSeconds, codeSecondsText('4:18'), code, onCodeChange, onSend, onVerify, verifyError
//   입력: form{bankCode,accountNo,accountHolder}, onFormChange(name, value), canSubmit, isSubmitting, onSubmit, submitError

function CurrentAccount({ text }) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-bold text-[#111827]">현재 계좌</span>
      <div className="h-12 px-4 flex items-center bg-[#f3f4f6] border border-[#e5e7eb] text-[15px] text-[#111827] tabular-nums">
        {text}
      </div>
    </div>
  );
}

function VerifyStep({ currentAccount, email, codeSent, resendSeconds, codeSecondsText, code, onCodeChange, onSend, onVerify, verifyError }) {
  return (
    <>
      <CardTitle
        title="계좌 변경"
        description="인출과 정산은 이 계좌로 들어가요. 계좌를 바꾸려면 가입한 이메일로 한 번 더 인증해 주세요."
      />
      <CurrentAccount text={currentAccount} />
      <div className="space-y-2">
        <span className="text-sm font-bold text-[#111827]">이메일</span>
        <div className="flex gap-2">
          <input type="text" value={email} readOnly placeholder="" aria-label="이메일" className={inputClass('flex-1')} />
          {!codeSent ? (
            <SideButton onClick={onSend}>인증번호 받기</SideButton>
          ) : resendSeconds > 0 ? (
            <SideButton variant="disabled">{`다시 받기 (${resendSeconds}초)`}</SideButton>
          ) : (
            <SideButton onClick={onSend}>다시 받기</SideButton>
          )}
        </div>
        {codeSent && <CheckLine>인증번호를 보냈어요. 메일함을 확인해 주세요.</CheckLine>}
      </div>
      {codeSent && (
        <div className="space-y-2">
          <span className="text-sm font-bold text-[#111827]">인증번호</span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                placeholder="6자리 숫자"
                aria-label="인증번호"
                className={inputClass('tracking-widest', 'border-[#0f4c3a]')}
                onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#b91c1c] tabular-nums">
                {codeSecondsText}
              </span>
            </div>
            <SideButton variant="primary" onClick={onVerify}>
              확인
            </SideButton>
          </div>
          <ActionErrorLine message={verifyError} className="" />
          <p className="text-[13px] text-[#6b7280]">
            인증번호는 5분 동안 쓸 수 있어요 · 60초 뒤에 다시 받을 수 있고, 하루 5번까지 받을 수 있어요
          </p>
        </div>
      )}
      {!codeSent && <ActionErrorLine message={verifyError} className="" />}
      <p className="text-[13px] text-[#6b7280]">카카오로 가입했어도 가입한 이메일로 인증해요.</p>
    </>
  );
}

function FormStep({ currentAccount, form, onFormChange, canSubmit, isSubmitting, onSubmit, submitError }) {
  const bankName = BANKS.find((bank) => bank.code === form.bankCode)?.name ?? '은행 선택';
  return (
    <>
      <CardTitle title="계좌 변경" description="인출과 정산은 이 계좌로 들어가요." />
      <CheckLine className="flex items-center gap-1.5 text-sm font-semibold text-[#0f4c3a]" iconClass="w-4 h-4" strokeWidth="3">
        이메일 인증을 마쳤어요
      </CheckLine>
      <CurrentAccount text={currentAccount} />
      <div className="space-y-2">
        <span className="text-sm font-bold text-[#111827]">은행</span>
        {/* 시안의 선택 상자 모양을 그대로 두고, 그 위에 투명한 select를 겹쳐 실제 선택을 받음 */}
        <div className={`relative ${inputClass('flex items-center justify-between', 'border-[#0f4c3a]')}`}>
          <span>{bankName}</span>
          <svg className="w-4 h-4 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
          <select
            aria-label="은행"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            value={form.bankCode}
            onChange={(event) => onFormChange('bankCode', event.target.value)}
          >
            <option value="">은행 선택</option>
            {BANKS.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#111827]">계좌번호</span>
        <input
          type="text"
          inputMode="numeric"
          value={form.accountNo}
          placeholder="- 없이 숫자만"
          className={inputClass()}
          onChange={(event) => onFormChange('accountNo', event.target.value.replace(/\D/g, ''))}
        />
        <p className="text-[13px] text-[#6b7280]">다른 회원이 등록한 계좌는 쓸 수 없어요</p>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#111827]">예금주</span>
        <input
          type="text"
          value={form.accountHolder}
          placeholder="예금주 이름"
          className={inputClass()}
          onChange={(event) => onFormChange('accountHolder', event.target.value)}
        />
      </label>
      <InfoNote>이미 신청한 인출은 신청할 때의 계좌로 들어가요.</InfoNote>
      <div>
        <SubmitButton disabled={!canSubmit || isSubmitting} onClick={onSubmit}>
          변경하기
        </SubmitButton>
        <ActionErrorLine message={submitError} />
      </div>
    </>
  );
}

function BankAccountView(props) {
  return (
    <AccountLayout active="bank">{props.isVerified ? <FormStep {...props} /> : <VerifyStep {...props} />}</AccountLayout>
  );
}

export default BankAccountView;
