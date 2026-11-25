import { ActionErrorLine } from '../common/ActionError';

// 「더 불러오기」 버튼 + 실패 안내 한 줄 (시안 02-3-3 · 05-3 목록 아래)
// hasMore가 false면 버튼을 숨기고, errorMessage가 있으면 버튼 아래에 보여 줌 (기존 목록은 그대로)
function LoadMoreButton({ hasMore, isLoading, onClick, errorMessage }) {
  return (
    <>
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 shadow-xs transition-all active:scale-95"
            onClick={onClick}
            disabled={isLoading}
          >
            <span>{isLoading ? '불러오는 중...' : '더 불러오기'}</span>
            <svg
              className="w-3.5 h-3.5 text-gray-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
      {errorMessage && <ActionErrorLine message={errorMessage} className="mt-3 text-center" />}
    </>
  );
}

export default LoadMoreButton;
