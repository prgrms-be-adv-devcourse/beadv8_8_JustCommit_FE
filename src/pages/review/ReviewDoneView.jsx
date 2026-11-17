import { Link } from 'react-router-dom';
import { withTopic } from './reviewFormat';

// 시안 05-2-3 리뷰 등록 완료
// props: orderTo(주문 상세 경로), next({ sellerNickname, untilText, to } | null), remainingCount
function ReviewDoneView({ orderTo, next, remainingCount }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 py-16 flex justify-center">
      <section className="w-full max-w-[560px] bg-white border border-[#e5e7eb] p-10 flex flex-col items-center text-center gap-7">
        <div className="w-16 h-16 bg-[#f4f8f6] border border-[#d1e7dd] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#0f4c3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">리뷰를 등록했어요</h1>
          {next && (
            <p className="text-sm text-[#4b5563]">
              {`리뷰를 쓸 판매자가 ${remainingCount}곳 남았어요 · ${withTopic(next.sellerNickname)} ${next.untilText}까지 쓸 수 있어요`}
            </p>
          )}
        </div>
        <p className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] text-[13px] text-[#6b7280]">
          등록한 리뷰는 수정할 수 없고, 등록 후 3일 안에만 삭제할 수 있어요
        </p>
        <div className="w-full flex gap-3">
          <Link
            to={orderTo}
            className="flex-1 h-12 flex items-center justify-center bg-white border border-[#0f4c3a] text-[#0f4c3a] text-[15px] font-bold"
          >
            주문 상세로 돌아가기
          </Link>
          {next && (
            <Link to={next.to} className="flex-1 h-12 flex items-center justify-center bg-[#0f4c3a] text-white text-[15px] font-bold">
              다음 판매자 리뷰 쓰기
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default ReviewDoneView;
