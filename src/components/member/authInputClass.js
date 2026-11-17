// 06 회원 시안의 입력칸 class (테두리 색만 상태에 따라 바뀜)
// 입력칸 테두리: 기본(회색) · 오류(빨강) · 확인됨/선택됨(초록)
const BORDER = {
  default: 'border-[#d1d5db]',
  error: 'border-[#b91c1c]',
  success: 'border-[#0f4c3a]',
};

function authInputClass(state = 'default', extra = '') {
  const base = `w-full h-12 px-4 border text-[15px] text-[#111827] placeholder-[#9ca3af] focus:ring-0 focus:border-[#0f4c3a] ${BORDER[state]}`;
  return extra ? `${base} ${extra}` : base;
}

export default authInputClass;
