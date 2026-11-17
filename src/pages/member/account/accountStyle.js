// 회원 정보 수정 화면 입력칸 클래스 (시안 06-5 그대로)

const INPUT_BASE =
  'w-full h-12 px-4 border text-[15px] text-[#111827] placeholder-[#9ca3af] focus:ring-0 focus:border-[#0f4c3a]';

// 입력칸 클래스: extra는 시안에서 뒤에 붙는 클래스 (예: 'bg-[#f3f4f6] text-[#4b5563]', 'flex-1')
export function inputClass(extra = '', borderClass = 'border-[#d1d5db]') {
  return `${INPUT_BASE} ${borderClass}${extra ? ` ${extra}` : ''}`;
}
