import PageBackLink from '../../components/common/PageBackLink';
import LoadMoreButton from '../../components/review/LoadMoreButton';
import ReviewCard from '../../components/review/ReviewCard';
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
              <ReviewCard key={review.key} review={review} as="li" />
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
        <LoadMoreButton
          hasMore={hasMore}
          isLoading={isLoadingMore}
          onClick={onLoadMore}
          errorMessage={loadMoreErrorMessage}
        />
      </div>
    </main>
  );
}

export default SellerReviewsView;
