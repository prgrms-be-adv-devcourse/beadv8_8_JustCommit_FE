import { ActionErrorBar } from '../../../components/common/ActionError';
import Modal from '../../../components/common/Modal';
import ModalButton from '../../../components/common/ModalButton';
import { CheckBox } from '../account/AccountUi';
import { inputClass } from '../account/accountStyle';

// 시안 06-5-10 배송지 추가 모달 (화면 모양만)
// props: title, form{addressName,recipientName,phoneText,zipcode,address1,address2,isDefault}, onChange(name, value),
//        onSearchAddress, phoneError, errorMessage, canSubmit, isSubmitting, onSubmit, onClose, showDefaultOption
function AddressModalView({
  title = '배송지 추가',
  form,
  onChange,
  onSearchAddress,
  phoneError,
  errorMessage,
  canSubmit,
  isSubmitting,
  onSubmit,
  onClose,
  showDefaultOption = true,
}) {
  return (
    <Modal
      title={title}
      width={480}
      onClose={onClose}
      footer={
        <>
          <ModalButton onClick={onClose}>취소</ModalButton>
          <ModalButton variant="primary" onClick={onSubmit} disabled={!canSubmit || isSubmitting}>
            저장
          </ModalButton>
        </>
      }
    >
      <ActionErrorBar message={errorMessage} />
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#111827]">
          배송지 이름 <span className="text-[13px] font-normal text-[#6b7280]">(선택)</span>
        </span>
        <input
          type="text"
          value={form.addressName}
          placeholder="예: 집, 회사"
          maxLength={20}
          className={inputClass()}
          onChange={(event) => onChange('addressName', event.target.value)}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#111827]">받는 사람</span>
        <input
          type="text"
          value={form.recipientName}
          placeholder="이름"
          maxLength={20}
          className={inputClass()}
          onChange={(event) => onChange('recipientName', event.target.value)}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-[#111827]">연락처</span>
        <input
          type="text"
          inputMode="numeric"
          value={form.phoneText}
          placeholder="010-0000-0000"
          className={inputClass()}
          onChange={(event) => onChange('phone', event.target.value)}
        />
        {phoneError && <span className="block text-[12px] text-[#dc2626] font-medium">{phoneError}</span>}
      </label>
      <div className="space-y-2">
        <span className="text-sm font-bold text-[#111827]">주소</span>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={form.zipcode}
            placeholder="우편번호"
            aria-label="우편번호"
            className={inputClass('bg-[#f3f4f6] flex-1')}
            onClick={onSearchAddress}
          />
          <button
            type="button"
            className="h-12 w-[120px] bg-white border border-[#0f4c3a] text-[#0f4c3a] text-sm font-semibold whitespace-nowrap shrink-0"
            onClick={onSearchAddress}
          >
            주소 검색
          </button>
        </div>
        <input
          type="text"
          readOnly
          value={form.address1}
          placeholder="기본 주소"
          aria-label="기본 주소"
          className={inputClass('bg-[#f3f4f6]')}
          onClick={onSearchAddress}
        />
        <input
          type="text"
          value={form.address2}
          placeholder="상세 주소 (동 · 호수)"
          aria-label="상세 주소"
          maxLength={100}
          className={inputClass()}
          onChange={(event) => onChange('address2', event.target.value)}
        />
      </div>
      {showDefaultOption && (
        <CheckBox checked={form.isDefault} onChange={(checked) => onChange('isDefault', checked)}>
          기본 배송지로 설정
        </CheckBox>
      )}
    </Modal>
  );
}

export default AddressModalView;
