// 밑줄 탭 버튼 + 숫자 칩 (시안 06-6 알림 · 05-3 리뷰 관리)
// countStyle: active면 초록 칩, 아니면 회색 칩. count가 undefined면 칩을 그리지 않음
function TabButton({ active, count, onClick, children }) {
  const tabClass = active
    ? 'border-[#0f4c3a] text-[#0f4c3a] font-bold'
    : 'border-transparent text-[#6b7280] font-medium';
  const chipClass = active ? 'bg-[#0f4c3a] text-white' : 'bg-[#f3f4f6] text-[#4b5563]';
  return (
    <button
      type="button"
      className={`h-12 px-4 -mb-px flex items-center gap-1.5 border-b-2 text-[15px] ${tabClass}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
      {count !== undefined && (
        <span className={`min-w-[22px] h-[22px] px-1.5 flex items-center justify-center text-xs font-semibold ${chipClass}`}>
          {count}
        </span>
      )}
    </button>
  );
}

export default TabButton;
