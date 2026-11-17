import { BANKS } from '../../constants/banks';
import { AuthInput, FieldHint, FieldLabel, FieldMessage, LabeledInput, SideButton } from './AuthField';
import authInputClass from './authInputClass';

// 회원가입 06-3-5 정보 입력 · 06-3-9 카카오 가입의 「기본 정보 · 환급 계좌 · 기본 배송지」 칸
//
// form: 화면에 그릴 값 (휴대폰 · 연락처는 하이픈 넣은 표시값)
//   nickname, nicknameState, nicknameMessage, password, passwordState, confirm, confirmState, confirmMessage,
//   phone, phoneState, phoneMessage, bankCode, bankName, accountNo, accountState, accountHolder,
//   recipientName, recipientPhone, zipcode, address1, address2, addressName
// on: 각 칸의 바뀜 · 버튼 처리
// emailField: 기본 정보 맨 위에 넣을 칸 (카카오 가입의 이메일), withPassword: 비밀번호 칸 표시 (이메일 가입)

function InfoSection({ title, description, children }) {
  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-[#e5e7eb]">
        <h2 className="text-base font-bold text-[#111827]">{title}</h2>
        {description && <p className="text-[13px] text-[#6b7280]">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// 입력칸 + 「중복 확인」 버튼 (닉네임 · 휴대폰)
function CheckField({ label, state, message, hint, onCheck, ...inputProps }) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-2">
        <AuthInput type="text" state={state} extra="flex-1" {...inputProps} />
        <SideButton variant="outline" onClick={onCheck}>
          중복 확인
        </SideButton>
      </div>
      <FieldMessage message={message} />
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

// 은행: 시안처럼 칸을 그리고, 그 위에 투명한 select를 덮어 고르게 함
function BankSelect({ bankCode, bankName, onChange }) {
  const selected = Boolean(bankCode);
  return (
    <div className="space-y-2">
      <FieldLabel>은행</FieldLabel>
      <div className={`${authInputClass(selected ? 'success' : 'default', 'flex items-center justify-between')} relative`}>
        <span className={selected ? undefined : 'text-[#9ca3af]'}>{selected ? bankName : '은행을 선택해 주세요'}</span>
        <svg className="w-4 h-4 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
        <select
          aria-label="은행"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          value={bankCode}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="" disabled>
            은행을 선택해 주세요
          </option>
          {BANKS.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function MemberInfoFields({ form, on, emailField = null, withPassword = false }) {
  return (
    <>
      <InfoSection title="기본 정보">
        {emailField}
        <CheckField
          label="닉네임"
          placeholder="닉네임"
          maxLength={8}
          state={form.nicknameState}
          message={form.nicknameMessage}
          hint="2 ~ 8자 · 한글 · 영문 · 숫자"
          value={form.nickname}
          onChange={(event) => on.nicknameChange(event.target.value)}
          onCheck={on.nicknameCheck}
        />
        {withPassword && (
          <>
            <LabeledInput
              label="비밀번호"
              type="password"
              placeholder="비밀번호"
              autoComplete="new-password"
              state={form.passwordState}
              value={form.password}
              onChange={(event) => on.passwordChange(event.target.value)}
            >
              <FieldHint>8 ~ 20자 · 영문 · 숫자 포함</FieldHint>
            </LabeledInput>
            <LabeledInput
              label="비밀번호 확인"
              type="password"
              placeholder="한 번 더 입력"
              autoComplete="new-password"
              state={form.confirmState}
              value={form.confirm}
              onChange={(event) => on.confirmChange(event.target.value)}
            >
              <FieldMessage message={form.confirmMessage} />
            </LabeledInput>
          </>
        )}
        <CheckField
          label="휴대폰 번호"
          placeholder="010-0000-0000"
          inputMode="numeric"
          autoComplete="tel"
          state={form.phoneState}
          message={form.phoneMessage}
          value={form.phone}
          onChange={(event) => on.phoneChange(event.target.value)}
          onCheck={on.phoneCheck}
        />
      </InfoSection>
      <InfoSection title="환급 계좌" description="판매 정산금과 예치금 인출을 이 계좌로 받아요">
        <BankSelect bankCode={form.bankCode} bankName={form.bankName} onChange={on.bankChange} />
        <LabeledInput
          label="계좌번호"
          type="text"
          inputMode="numeric"
          placeholder="- 없이 숫자만"
          state={form.accountState}
          value={form.accountNo}
          onChange={(event) => on.accountNoChange(event.target.value)}
        >
          <FieldHint>다른 회원이 등록한 계좌는 쓸 수 없어요</FieldHint>
        </LabeledInput>
        <LabeledInput
          label="예금주"
          type="text"
          placeholder="예금주 이름"
          maxLength={50}
          value={form.accountHolder}
          onChange={(event) => on.accountHolderChange(event.target.value)}
        />
      </InfoSection>
      <InfoSection title="기본 배송지" description="주문할 때 기본으로 쓰는 배송지예요. 나중에 4개까지 추가할 수 있어요">
        <LabeledInput
          label="받는 사람"
          type="text"
          placeholder="받는 사람 이름"
          maxLength={20}
          autoComplete="name"
          value={form.recipientName}
          onChange={(event) => on.recipientNameChange(event.target.value)}
        />
        <LabeledInput
          label="연락처"
          type="text"
          inputMode="numeric"
          placeholder="010-0000-0000"
          value={form.recipientPhone}
          onChange={(event) => on.recipientPhoneChange(event.target.value)}
        />
        <div className="space-y-2">
          <FieldLabel>주소</FieldLabel>
          <div className="flex gap-2">
            <AuthInput
              type="text"
              readOnly
              aria-label="우편번호"
              extra="bg-[#f3f4f6] w-[120px]"
              value={form.zipcode}
              onClick={on.searchAddress}
            />
            <button
              type="button"
              onClick={on.searchAddress}
              className="h-12 w-[120px] bg-white border border-[#0f4c3a] text-[#0f4c3a] text-sm font-semibold whitespace-nowrap shrink-0"
            >
              주소 검색
            </button>
          </div>
          <AuthInput type="text" readOnly aria-label="주소" extra="bg-[#f3f4f6]" value={form.address1} onClick={on.searchAddress} />
          <AuthInput
            type="text"
            placeholder="상세 주소"
            aria-label="상세 주소"
            maxLength={100}
            value={form.address2}
            onChange={(event) => on.address2Change(event.target.value)}
          />
          <FieldMessage message={form.addressMessage} />
        </div>
        <LabeledInput
          label="배송지 이름 (선택)"
          type="text"
          placeholder="예: 집, 회사"
          maxLength={20}
          value={form.addressName}
          onChange={(event) => on.addressNameChange(event.target.value)}
        />
      </InfoSection>
    </>
  );
}

export default MemberInfoFields;
