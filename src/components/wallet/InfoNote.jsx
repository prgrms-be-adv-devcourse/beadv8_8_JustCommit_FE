// 회색 ⓘ 안내 한 줄 (시안 07 충전 · 충전 내역 · 인출 · 인출 내역 아래쪽 안내)
function InfoNote({ children }) {
  return (
    <p className="flex gap-1.5 text-[13px] text-[#4b5563] leading-relaxed">
      <svg className="w-4 h-4 text-[#9ca3af] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{children}</span>
    </p>
  );
}

export default InfoNote;
