import { useEffect } from 'react';

// 시안 화면들의 모달 공통 틀 (예: 04-1 취소 확인 · 20 탈퇴 불가)
// - 배경: bg-black/50, 카드는 위에서 top(px)만큼 내려 가운데 정렬
// - 머리: 제목 + ✕ / 본문: p-6 text-[14px] / 바닥: 버튼 줄 (footer)
// 캔버스에서는 확대 · 이동 때문에 absolute로 그렸지만, 앱에서는 화면에 고정(fixed)합니다.
// 창이 낮아 카드가 넘치면: 위 여백(top)부터 16px까지 줄이고, 그래도 넘치면 본문만 스크롤 (머리 · 바닥 버튼은 항상 보임)
//
// width: 카드 너비(px). 시안에 쓰인 값: 400 · 440 · 480 · 520 · 680
// top: 화면 위에서 카드까지 거리(px). 시안 값: 160 · 180
// bodyClassName: 본문 줄 간격. 기본 space-y-4 (시안 대부분), 일부 space-y-3
function Modal({
  title,
  onClose,
  width = 440,
  top = 180,
  bodyClassName = 'space-y-4',
  footer,
  children,
}) {
  // 모달이 열려 있는 동안 뒤 화면 스크롤 막기 + Esc로 닫기
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex flex-col items-center p-4">
      {/* 위 여백: 시안 top 값. 공간이 모자라면 이 칸이 먼저 0까지 줄어듦 */}
      <div
        aria-hidden="true"
        className="min-h-0"
        style={{ flex: `0 1 ${Math.max(top - 16, 0)}px` }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="bg-white border border-[#e5e7eb] shadow-2xl flex flex-col shrink-0"
        style={{ width: `${width}px`, maxWidth: '100%', maxHeight: 'calc(100dvh - 32px)' }}
      >
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <h3 id="modal-title" className="text-base font-bold text-[#111827]">
            {title}
          </h3>
          <button
            type="button"
            className="text-[#6b7280] hover:text-[#111827] text-lg leading-none"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <div className={`p-6 text-[14px] min-h-0 overflow-y-auto ${bodyClassName}`}>{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-[#e5e7eb] bg-[#f9fafb] flex justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
