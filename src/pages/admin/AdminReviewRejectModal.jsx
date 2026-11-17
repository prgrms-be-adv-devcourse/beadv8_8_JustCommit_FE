import { useState } from 'react';
import Modal from '../../components/common/Modal';
import ModalButton from '../../components/common/ModalButton';
import { ActionErrorBar } from '../../components/common/ActionError';
import { ADMIN_REJECT_REASONS, OTHER_REASON_MAX_LENGTH } from '../../constants/imageReview';

// 시안 09-2-3 반려 사유 선택 (AdminReviewReject)
// initialCode: 처음 골라 둘 사유 (자동 반려 건이면 그 사유). onSubmit({ reasonCode, reasonText })
function AdminReviewRejectModal({ initialCode = null, onClose, onSubmit, busy = false, error }) {
  const [code, setCode] = useState(initialCode);
  const [otherText, setOtherText] = useState('');

  const isOther = code === 'OTHER';
  const canSubmit = code && (!isOther || otherText.trim()) && !busy;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ reasonCode: code, reasonText: isOther ? otherText.trim() : null });
  };

  const handleKey = (event, reasonCode) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setCode(reasonCode);
    }
  };

  return (
    <Modal
      title="반려 사유 선택"
      width={560}
      top={160}
      bodyClassName="space-y-3"
      onClose={onClose}
      footer={
        <>
          <ModalButton variant="secondary" onClick={onClose}>
            취소
          </ModalButton>
          <ModalButton variant="danger" onClick={handleSubmit} disabled={!canSubmit}>
            반려하기
          </ModalButton>
        </>
      }
    >
      <p className="text-[#4b5563]">판매자에게는 오른쪽 문구가 그대로 보여요.</p>
      <ul
        role="radiogroup"
        aria-label="반려 사유"
        className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]"
      >
        {ADMIN_REJECT_REASONS.map((reason) => {
          const checked = reason.code === code;
          return (
            <li
              key={reason.code}
              role="radio"
              aria-checked={checked}
              tabIndex={0}
              className={`px-4 py-3 flex items-center gap-3 cursor-pointer ${checked ? 'bg-[#f4f8f6]' : ''}`}
              onClick={() => setCode(reason.code)}
              onKeyDown={(event) => handleKey(event, reason.code)}
            >
              <span
                className={`w-4 h-4 border-2 shrink-0 flex items-center justify-center ${
                  checked ? 'border-[#0f4c3a]' : 'border-[#d1d5db]'
                }`}
              >
                {checked && <span className="w-2 h-2 bg-[#0f4c3a]"></span>}
              </span>
              <span className="w-[132px] font-semibold text-[#111827]">{reason.label}</span>
              <span className="flex-1 text-[13px] text-[#4b5563]">{reason.message}</span>
            </li>
          );
        })}
      </ul>
      {/* 시안에 없는 부분: 「기타」를 고르면 판매자에게 보일 문구를 직접 입력 (docs: 필수, 200자) */}
      {isOther && (
        <textarea
          value={otherText}
          onChange={(event) => setOtherText(event.target.value)}
          maxLength={OTHER_REASON_MAX_LENGTH}
          rows={3}
          placeholder="판매자에게 보일 반려 사유를 적어 주세요 (200자까지)"
          aria-label="기타 반려 사유"
          className="w-full px-3 py-2 border border-[#d1d5db] text-[14px] text-[#111827] resize-none focus:outline-none focus:border-[#0f4c3a]"
        />
      )}
      <ActionErrorBar message={error} />
    </Modal>
  );
}

export default AdminReviewRejectModal;
