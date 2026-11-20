import { Link, useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

// 준비 중 화면 (시안 01-2-3). 리뷰 · 이용약관처럼 아직 만들지 않은 기능으로 들어오면 보여 줌
// 모양은 오류 화면(ErrorPage)과 같은 규칙: 가운데 정렬 · 제목 24px · 설명 14px · 버튼 높이 36px
// title = 기능 이름 (예: 「리뷰 작성」). 설명 「{title} 화면은 아직 준비 중이에요.」에 들어감
function ComingSoonPage({ title }) {
  const navigate = useNavigate();
  usePageTitle(title);

  return (
    <main className="flex-1 flex flex-col">
      <div className="flex flex-col items-center justify-center text-center my-auto py-16 px-6">
        <span className="w-16 h-16 flex items-center justify-center bg-[#f4f8f6] border border-[#d1e7dd] text-[#0f4c3a] mb-5">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 2" />
          </svg>
        </span>
        <h1 className="text-2xl font-bold text-[#111827] mb-2">준비 중인 페이지예요</h1>
        <p className="text-sm text-[#4b5563] mb-6">{`${title} 화면은 아직 준비 중이에요.`}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-9 px-4 flex items-center bg-white text-[#111827] border border-[#d1d5db] text-sm font-medium"
            onClick={() => navigate(-1)}
          >
            이전으로
          </button>
          <Link to="/" className="h-9 px-4 flex items-center bg-[#0f4c3a] text-white text-sm font-medium">
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}

export default ComingSoonPage;
