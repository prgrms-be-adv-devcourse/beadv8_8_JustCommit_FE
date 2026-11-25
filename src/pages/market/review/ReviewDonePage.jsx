import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { getOrderReviewStatus } from '../../../api/reviewApi';
import ErrorPage from '../../../components/common/ErrorPage';
import useAuth from '../../../hooks/useAuth';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatMonthDay } from '../../../utils/format';

// 받침이 있으면 「은」, 없으면 「는」 (한글이 아니면 「는」)
function topicParticle(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return '는';
  return code % 28 === 0 ? '는' : '은';
}

// 등록 후 주문별 리뷰 상태(writableCount · nextWritable)로 남은 판매자 안내
function remainText(summary) {
  const next = summary.nextWritable;
  if (summary.writableCount > 0 && next) {
    const name = next.sellerNickname ?? '다음 판매자';
    return `리뷰를 쓸 판매자가 ${summary.writableCount}곳 남았어요 · ${name}${topicParticle(name)} ${formatMonthDay(next.writableUntil)}까지 쓸 수 있어요`;
  }
  return '이 주문에서 지금 쓸 수 있는 리뷰를 모두 작성했어요';
}

// 시안 05-2-3 리뷰 등록 완료. 주소: /orders/{orderId}/review/done
// 새로고침 · 직접 진입해도 주문별 상태를 다시 조회해서 그림
function ReviewDonePage() {
  usePageTitle('리뷰 등록 완료');
  const { orderId } = useParams();
  const location = useLocation();
  const { isLoggedIn, isInitializing } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | done | notFound | error

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    getOrderReviewStatus(orderId)
      .then((response) => {
        if (ignore) return;
        setSummary(response.data.data.summary);
        setLoadState('done');
      })
      .catch((error) => {
        if (!ignore) setLoadState(error.response?.status === 404 ? 'notFound' : 'error');
      });
    return () => {
      ignore = true;
    };
  }, [isLoggedIn, orderId]);

  if (isInitializing) return <main className="flex-1" />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (loadState === 'loading') return <main className="flex-1" />;
  if (loadState === 'notFound') return <ErrorPage type="NOT_FOUND" />;

  const next = summary?.nextWritable;
  const orderTo = `/orders/${orderId}`;

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 py-16 flex justify-center">
      <section className="w-full max-w-[560px] bg-white border border-[#e5e7eb] p-10 flex flex-col items-center text-center gap-7">
        <div className="w-16 h-16 bg-[#f4f8f6] border border-[#d1e7dd] flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[#0f4c3a]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">리뷰를 등록했어요</h1>
          <p className="text-sm text-[#4b5563]">
            {/* 상태를 못 불러오면 남은 판매자 안내만 빼고 주문 상세로 돌아갈 수 있게 */}
            {summary
              ? remainText(summary)
              : '남은 리뷰를 불러오지 못했어요. 주문 상세에서 확인해 주세요.'}
          </p>
        </div>
        <p className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] text-[13px] text-[#6b7280]">
          등록한 리뷰는 수정할 수 없고, 등록 후 3일 안에만 삭제할 수 있어요
        </p>
        <div className="w-full flex flex-col sm:flex-row gap-3">
          {next ? (
            <>
              <Link
                to={orderTo}
                className="flex-1 h-12 flex items-center justify-center bg-white border border-[#0f4c3a] text-[#0f4c3a] text-[15px] font-bold"
              >
                주문 상세로 돌아가기
              </Link>
              <Link
                to={`/orders/${orderId}/review?sellerOrderId=${next.sellerOrderId}`}
                state={location.state?.from ? { from: location.state.from } : undefined}
                className="flex-1 h-12 flex items-center justify-center bg-[#0f4c3a] text-white text-[15px] font-bold"
              >
                다음 판매자 리뷰 쓰기
              </Link>
            </>
          ) : (
            // 다음 판매자가 없으면 주문 상세로 돌아가는 버튼 하나 (시안에 없는 상태)
            <Link
              to={orderTo}
              className="flex-1 h-12 flex items-center justify-center bg-[#0f4c3a] text-white text-[15px] font-bold"
            >
              주문 상세로 돌아가기
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default ReviewDonePage;
