import { useState } from 'react';
import { Link } from 'react-router-dom';
import TermsModal from '../common/TermsModal';

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// 회원가입 정보 입력(06-3-6) · 카카오 가입(06-3-10) 가입 버튼 바로 위 「[필수] 이용약관 · 개인정보처리방침 동의」
// 「이용약관 보기」는 푸터와 같은 이용약관 모달, 「개인정보처리방침 보기」는 /privacy
function TermsAgreement({ agreed, onChange }) {
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <>
      <label className="p-4 bg-[#f9fafb] border border-[#e5e7eb] flex items-start gap-3 cursor-pointer">
        {agreed ? (
          <span className="w-5 h-5 mt-0.5 flex items-center justify-center bg-[#0f4c3a] text-white shrink-0">
            <CheckIcon />
          </span>
        ) : (
          <span className="w-5 h-5 mt-0.5 border-2 border-[#d1d5db] bg-white shrink-0" />
        )}
        <span className="flex-1 space-y-1">
          <span className="block text-sm font-bold text-[#111827]">
            <span className="text-[#b91c1c]">[필수]</span>
            {' 이용약관과 개인정보처리방침에 동의해요'}
          </span>
          <span className="flex gap-3 text-[13px]">
            <a
              href="/terms"
              className="font-semibold text-[#0f4c3a] underline"
              onClick={(event) => {
                event.preventDefault();
                setIsTermsOpen(true);
              }}
            >
              이용약관 보기
            </a>
            <Link to="/privacy" className="font-semibold text-[#0f4c3a] underline">
              개인정보처리방침 보기
            </Link>
          </span>
        </span>
        {/* 실제 체크 칸은 눈에 안 보이게 맨 뒤에 둠 */}
        <input type="checkbox" className="sr-only" checked={agreed} onChange={(event) => onChange(event.target.checked)} />
      </label>
      {isTermsOpen && <TermsModal onClose={() => setIsTermsOpen(false)} />}
    </>
  );
}

export default TermsAgreement;
