import { useState } from 'react';
import Modal from '../../components/common/Modal';
import ModalButton from '../../components/common/ModalButton';
import { ActionErrorBar } from '../../components/common/ActionError';
import { ADMIN_REJECT_REASONS, OTHER_REASON_MAX_LENGTH } from '../../constants/imageReview';

// 시안 09-2-3 반려 사유 선택 (AdminReviewReject) · 09-2-4 「기타」 직접 입력 (AdminReviewRejectOther)
// initialCode: 처음 골라 둘 사유 (자동 반려 건이면 그 사유), initialText: 「기타」 입력칸 처음 값. onSubmit({ reasonCode, reasonText })
function AdminReviewRejectModal({ initialCode = null, initialText = '', onClose, onSubmit, busy = false, error }) {
  const [code, setCode] = useState(initialCode);
  const [otherText, setOtherText] = useState(initialText);

  const isOther = code === 'OTHER';
  const canSubmit = code && (!isOther || otherText.trim()) && !busy;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ reasonCode: code, reasonText: isOther ? otherText.trim() : null });
  };

  const handleKey = (event, reasonCode) => {
    // 「기타」 입력칸 안에서 누른 키(스페이스 · 엔터)는 그대로 글자로 들어가게 둠
    if (event.target !== event.currentTarget) return;
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
          const radio = (
            <span
              className={`w-4 h-4 border-2 shrink-0 flex items-center justify-center ${
                checked ? 'border-[#0f4c3a]' : 'border-[#d1d5db]'
              }`}
            >
              {checked && <span className="w-2 h-2 bg-[#0f4c3a]"></span>}
            </span>
          );
          const label = (
            <>
              <span className="w-[132px] font-semibold text-[#111827]">{reason.label}</span>
              <span className="flex-1 text-[13px] text-[#4b5563]">{reason.message}</span>
            </>
          );
          const expanded = checked && reason.code === 'OTHER';
          return (
            <li
              key={reason.code}
              role="radio"
              aria-checked={checked}
              tabIndex={0}
              className={
                expanded
                  ? 'px-4 py-3 space-y-3 bg-[#f4f8f6]'
                  : `px-4 py-3 flex items-center gap-3 cursor-pointer ${checked ? 'bg-[#f4f8f6]' : ''}`
              }
              onClick={() => setCode(reason.code)}
              onKeyDown={(event) => handleKey(event, reason.code)}
            >
              {expanded ? (
                <>
                  <div className="flex items-center gap-3">
                    {radio}
                    {label}
                  </div>
                  {/* 「기타」: 판매자에게 보일 문구를 직접 입력 (docs: 필수, 200자) */}
                  <div className="relative">
                    <textarea
                      rows={3}
                      maxLength={OTHER_REASON_MAX_LENGTH}
                      value={otherText}
                      onChange={(event) => setOtherText(event.target.value)}
                      aria-label="기타 반려 사유"
                      className="w-full p-3 pb-8 bg-white border border-[#0f4c3a] text-[14px] text-[#111827] leading-relaxed resize-none focus:ring-0 focus:border-[#0f4c3a]"
                    />
                    <span className="absolute right-3 bottom-2.5 text-[13px] text-[#6b7280] tabular-nums">
                      {`${otherText.length} / ${OTHER_REASON_MAX_LENGTH}`}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#6b7280]">
                    {`판매자에게 이 내용이 그대로 보여요. ${OTHER_REASON_MAX_LENGTH}자까지 쓸 수 있어요.`}
                  </p>
                </>
              ) : (
                <>
                  {radio}
                  {label}
                </>
              )}
            </li>
          );
        })}
      </ul>
      <ActionErrorBar message={error} />
    </Modal>
  );
}

export default AdminReviewRejectModal;
