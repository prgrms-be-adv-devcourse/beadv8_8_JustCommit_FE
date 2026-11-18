// 밑줄 탭 버튼 + 숫자 칩 (05-3 리뷰 관리 · 06-6 알림 · 08 내 판매 목록 · 판매 주문 시안 공통 모양)
// - 선택된 탭: 초록 밑줄 + 초록 칩, 아니면 회색 칩. count가 undefined면 칩을 그리지 않음
// - compact: 탭이 많은 화면(08)의 좁은 여백(px-3.5, 줄바꿈 없음). 기본은 px-4 (05 · 06)
// - 나머지 props(role, aria-*)는 button에 그대로 넘김. role이 없으면 aria-pressed로 선택 상태를 알림
function UnderlineTab({ active, count, onClick, compact = false, children, ...rest }) {
  const sizeClass = compact ? 'h-12 px-3.5 -mb-px flex items-center gap-1.5 border-b-2 text-[15px] whitespace-nowrap' : 'h-12 px-4 -mb-px flex items-center gap-1.5 border-b-2 text-[15px]';
  const tabClass = active ? 'border-[#0f4c3a] text-[#0f4c3a] font-bold' : 'border-transparent text-[#6b7280] font-medium';
  const chipClass = active ? 'bg-[#0f4c3a] text-white' : 'bg-[#f3f4f6] text-[#4b5563]';
  return (
    <button type="button" className={`${sizeClass} ${tabClass}`} onClick={onClick} aria-pressed={rest.role ? undefined : active} {...rest}>
      {children}
      {count !== undefined && (
        <span className={`min-w-[22px] h-[22px] px-1.5 flex items-center justify-center text-xs font-semibold ${chipClass}`}>
          {count}
        </span>
      )}
    </button>
  );
}

export default UnderlineTab;
