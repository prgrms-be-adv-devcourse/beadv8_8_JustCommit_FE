import { ActionErrorLine } from '../../components/common/ActionError';
import PageBackLink from '../../components/common/PageBackLink';
import Stars from '../../components/review/Stars';
import SellerShopBar from '../../components/seller/SellerShopBar';

// 판매자 상점 · 리뷰 전체 (시안 02-3-3). 별점 분포 막대는 넣지 않음
// seller = SellerShopBar의 seller, reviewCountText = "23개"
// tags = 태그 칩 [{ label, count }] (많은 순, 0개 제외)
// reviews = [{ key, nickname, rating, ratingText, dateText, content, productText }] (최신순)
// hasMore · isLoadingMore · onLoadMore · loadMoreErrorMessage = 「더 불러오기」
// backTo · backState = 「‹ 상점」 이동할 곳 · router state
function SellerReviewsView({
  seller,
  reviewCountText,
  tags,
  reviews,
  hasMore,
  isLoadingMore,
  onLoadMore,
  loadMoreErrorMessage,
  backTo,
  backState,
}) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="space-y-6">
        <PageBackLink to={backTo} state={backState} label="상점" />
        <SellerShopBar seller={seller} />
        <h2 className="text-xl font-bold text-[#111827]">
          {'리뷰 '}
          <span className="text-[15px] font-medium text-[#4b5563] tabular-nums">
            {reviewCountText}
          </span>
        </h2>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className="h-7 px-2.5 flex items-center gap-1 bg-[#f4f8f6] border border-[#d1e7dd] text-[13px] text-[#0f4c3a]"
              >
                {tag.label}
                <b className="font-semibold tabular-nums">{tag.count.toLocaleString('ko-KR')}</b>
              </span>
            ))}
          </div>
        )}
        {reviews.length > 0 ? (
          <ul className="max-w-[880px] space-y-3">
            {reviews.map((review) => (
              <li key={review.key} className="bg-white border border-[#e5e7eb] p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 flex items-center justify-center bg-[#f4f8f6] border border-[#d1e7dd] text-[#0f4c3a] text-sm font-bold shrink-0">
                    {review.nickname.charAt(0)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-[#111827]">{review.nickname}</p>
                    {/* 좁은 화면에서는 별 아래로 내려가도 「5.0점 · 최고예요」는 한 덩어리로 */}
                    <div className="flex flex-wrap items-center gap-x-2">
                      <Stars rating={review.rating} />
                      <span className="text-[13px] font-semibold text-[#111827] tabular-nums whitespace-nowrap">
                        {review.ratingText}
                      </span>
                    </div>
                  </div>
                  <span className="text-[13px] text-[#6b7280] tabular-nums">{review.dateText}</span>
                </div>
                {/* 시안은 줄바꿈을 <br>로 그림. 작성한 글의 줄바꿈을 그대로 보여 줌 */}
                <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-line">
                  {review.content}
                </p>
                {review.productText && (
                  <p className="text-[13px] text-[#6b7280]">{review.productText}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          // 리뷰 0개 (시안에 없는 상태. 상점의 「판매 중 상품 없음」 빈 상태 모양을 따름)
          <div className="max-w-[880px] bg-white border border-[#e5e7eb] px-6 py-20 flex flex-col items-center text-center gap-3">
            <h3 className="text-xl font-bold text-[#111827]">아직 받은 리뷰가 없어요</h3>
            <p className="text-[15px] text-[#4b5563]">
              구매자가 리뷰를 남기면 여기에서 볼 수 있어요.
            </p>
          </div>
        )}
        {hasMore && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 shadow-xs transition-all active:scale-95"
              onClick={onLoadMore}
              disabled={isLoadingMore}
            >
              <span>{isLoadingMore ? '불러오는 중...' : '더 불러오기'}</span>
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
        {loadMoreErrorMessage && (
          <ActionErrorLine message={loadMoreErrorMessage} className="mt-3 text-center" />
        )}
      </div>
    </main>
  );
}

export default SellerReviewsView;
