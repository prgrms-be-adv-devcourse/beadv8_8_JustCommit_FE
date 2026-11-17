import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';

// 전체 오류 화면 (시안 01-1-5 오류 쇼케이스 GROUP 02 · 5종)
// 크기는 쇼케이스 「Tailwind 클래스 매핑 가이드 1」의 실제 화면 값(제목 24px · 설명 14px · 위아래 py-16)을 씀
const ERROR_PAGES = {
  NOT_FOUND: {
    code: '404',
    title: '페이지를 찾을 수 없어요',
    description: '주소가 바뀌었거나 삭제된 페이지예요.',
    actions: [
      { label: '이전으로', variant: 'secondary', to: -1 },
      { label: '홈으로', variant: 'primary', to: '/' },
    ],
  },
  PRODUCT_NOT_FOUND: {
    code: '404',
    title: '상품을 찾을 수 없어요',
    description: '삭제됐거나 없는 상품이에요.',
    actions: [{ label: '다른 식물 보기', variant: 'primary', to: '/' }],
  },
  PRODUCT_HIDDEN: {
    code: '403',
    title: '지금은 볼 수 없는 상품이에요',
    description: '판매자가 상품을 숨겼어요.',
    actions: [{ label: '다른 식물 보기', variant: 'primary', to: '/' }],
  },
  FORBIDDEN: {
    code: '403',
    title: '접근 권한이 없어요',
    description: '관리자만 볼 수 있는 페이지예요.',
    actions: [{ label: '홈으로', variant: 'primary', to: '/' }],
  },
  SERVER_ERROR: {
    code: '500',
    title: '일시적인 오류가 생겼어요',
    description: '잠시 후 다시 시도해 주세요.',
    actions: [
      { label: '홈으로', variant: 'secondary', to: '/' },
      { label: '다시 시도', variant: 'primary', retry: true },
    ],
  },
};

const BUTTON_CLASS = {
  primary: 'h-9 px-4 bg-[#0f4c3a] hover:bg-[#083226] text-white text-sm font-medium',
  secondary: 'h-9 px-4 bg-white hover:bg-[#f9fafb] text-[#111827] border border-[#d1d5db] text-sm font-medium',
};

// type: ERROR_PAGES의 키. onRetry: 「다시 시도」를 눌렀을 때 (없으면 새로고침)
function ErrorPage({ type = 'NOT_FOUND', onRetry }) {
  const navigate = useNavigate();
  const page = ERROR_PAGES[type];
  usePageTitle(page.title);

  const handleClick = (action) => {
    if (action.retry) {
      if (onRetry) onRetry();
      else window.location.reload();
      return;
    }
    navigate(action.to);
  };

  return (
    <main className="flex-1 flex flex-col">
      <div className="flex flex-col items-center justify-center text-center my-auto py-16 px-6">
        <span className="text-5xl font-black text-[#e5e7eb] tracking-wider mb-2 font-mono">{page.code}</span>
        <h1 className="text-2xl font-bold text-[#111827] mb-2">{page.title}</h1>
        <p className="text-sm text-[#4b5563] mb-6">{page.description}</p>
        <div className="flex items-center gap-2">
          {page.actions.map((action) => (
            <button key={action.label} type="button" className={BUTTON_CLASS[action.variant]} onClick={() => handleClick(action)}>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export default ErrorPage;
