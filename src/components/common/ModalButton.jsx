// 모달 바닥 버튼 (시안: h-9, 기본 너비 88px, 글자가 길면 fit으로 px-4)
// variant: secondary(흰 바탕 · 닫기 · 취소) · primary(초록 · 확인) · danger(빨강 · 취소하기 · 삭제 · 반려)
const VARIANT_CLASS = {
  secondary: 'bg-white border border-[#d1d5db] text-[14px] font-medium text-[#111827]',
  primary: 'bg-[#0f4c3a] text-white text-[14px] font-medium',
  danger: 'bg-[#b91c1c] text-white text-[14px] font-medium',
};

function ModalButton({ variant = 'secondary', fit = false, type = 'button', className = '', children, ...rest }) {
  const size = fit ? 'h-9 px-4' : 'h-9 w-[88px]';
  return (
    <button type={type} className={`${size} ${VARIANT_CLASS[variant]} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}

export default ModalButton;
