import PageBackLink from '../../components/common/PageBackLink';
import { ActionErrorLine } from '../../components/common/ActionError';
import ReviewCard from '../../components/review/ReviewCard';
import SellerShopBar from '../../components/seller/SellerShopBar';
import SellerTagChips from '../../components/seller/SellerTagChips';

// 판매자 상점 · 리뷰 전체 (시안 02-3-3)
// seller = SellerShopBar의 seller, reviewCountText = "23개"
// tags = 받은 태그 칩 [{ label, count }] (「리뷰 N개」 아래)
// reviews = [ ReviewCard의 review ], backTo = 「< 상점」 이동할 곳
// hasMore · isLoadingMore · onLoadMore = 「더 불러오기」, errorMessage = 더 불러오기 실패 안내
function SellerReviewsView({ seller, reviewCountText, tags, reviews, backTo, backState, hasMore, isLoadingMore, onLoadMore, errorMessage }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="space-y-6">
        <PageBackLink to={backTo} state={backState} label="상점" />
        <SellerShopBar seller={seller} />
        <h2 className="text-xl font-bold text-[#111827]">
          {'리뷰 '}
          <span className="text-[15px] font-medium text-[#4b5563] tabular-nums">{reviewCountText}</span>
        </h2>
        <SellerTagChips tags={tags} />
        <ul className="max-w-[880px] space-y-3">
          {reviews.map((review) => (
            <li key={review.reviewId}>
              <ReviewCard review={review} tabularRating />
            </li>
          ))}
        </ul>
        {hasMore && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 shadow-xs transition-all active:scale-95"
              onClick={onLoadMore}
              disabled={isLoadingMore}
            >
              <span>{isLoadingMore ? '불러오는 중...' : '더 불러오기'}</span>
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
        {errorMessage && <ActionErrorLine message={errorMessage} className="mt-3 text-center" />}
      </div>
    </main>
  );
}

export default SellerReviewsView;
