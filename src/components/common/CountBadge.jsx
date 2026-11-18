// 헤더 장바구니 · 알림 아이콘 위 원형 숫자 배지 (시안 01-2-1)
// 전역 규칙(모든 요소 모서리 0px !important)을 이기려고 시안처럼 인라인 9999px !important를 줌
function CountBadge({ count }) {
  if (!count) return null;
  return (
    <span
      ref={(el) => el?.style.setProperty('border-radius', '9999px', 'important')}
      className="absolute -top-1 -right-1.5 w-5 h-5 text-white text-[11px] font-bold flex items-center justify-center leading-none z-10 shadow-xs"
      style={{ backgroundColor: 'rgb(15, 76, 58)', top: '1px', right: '0px' }}
      aria-hidden="true"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default CountBadge;
