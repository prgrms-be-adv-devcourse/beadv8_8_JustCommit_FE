// 동작 실패 안내 (토스트 대신, 시안 01-1-5 오류 쇼케이스 GROUP 04)
// 사라지지 않고, 사용자가 버튼을 다시 누르면 부모가 message를 비워서 사라지게 합니다.

// 모달 본문 안 빨간 안내 바
export function ActionErrorBar({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="bg-[#fef2f2] border border-[#fecaca] p-2.5 flex items-center gap-2">
      <svg className="w-4 h-4 text-[#dc2626] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-[12px] font-semibold text-[#b91c1c] leading-tight">{message}</span>
    </div>
  );
}

// 버튼 바로 아래 한 줄
export function ActionErrorLine({ message, className = 'mt-1.5' }) {
  if (!message) return null;
  return (
    <p role="alert" className={`text-[12px] text-[#dc2626] font-medium leading-tight ${className}`}>
      {message}
    </p>
  );
}

