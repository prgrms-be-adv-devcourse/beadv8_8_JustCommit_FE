import { useId, useState } from 'react';

// 판매자 등록 [필수] 검수 동의 상자 (시안 06-3-7, 본문은 08-1-1 판매자 등록 시안과 같음)
// 체크 칸을 누르면 동의, 「자세히 보기 ▾ / 접기 ▴」로 본문을 펼침
// policy: { title, content } (useSellerConsentPolicy), agreed · onAgreedChange
function SellerConsentBox({ policy, agreed, onAgreedChange, defaultOpen = false }) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="bg-[#f9fafb] border border-[#e5e7eb] p-4">
      <div className="flex items-start gap-3">
        {agreed ? (
          <label
            htmlFor={id}
            className="w-[22px] h-[22px] mt-0.5 border-2 border-[#0f4c3a] bg-white flex items-center justify-center shrink-0"
          >
            <svg className="w-4 h-4 text-[#0f4c3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </label>
        ) : (
          <label htmlFor={id} className="w-[22px] h-[22px] mt-0.5 border-2 border-[#d1d5db] bg-white shrink-0" />
        )}
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={agreed}
          onChange={(event) => onAgreedChange(event.target.checked)}
        />
        <div>
          <label htmlFor={id} className="text-sm font-bold text-[#111827] leading-[1.55]">
            <span className="text-[#b91c1c]">[필수]</span>
            {` ${policy.title}`}
          </label>
          <br />
          <button
            type="button"
            aria-expanded={isOpen}
            className="mt-1.5 min-h-[32px] p-0 text-[13px] font-semibold text-[#0f4c3a] underline"
            onClick={() => setIsOpen((open) => !open)}
          >
            {isOpen ? '접기 ▴' : '자세히 보기 ▾'}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="mt-3.5 px-4 py-3.5 max-h-[260px] overflow-y-auto bg-white border border-[#e5e7eb]">
          <p className="m-0 whitespace-pre-line text-[13px] leading-[1.7] text-[#4b5563]">{policy.content}</p>
        </div>
      )}
    </section>
  );
}

export default SellerConsentBox;
