import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getSeller } from '../../api/memberApi';
import { getSellerSoldOutProducts } from '../../api/productApi';
import { getSellerReviews, getSellerReviewSummary } from '../../api/reviewApi';
import ErrorPage from '../../components/common/ErrorPage';
import usePageTitle from '../../hooks/usePageTitle';
import SellerReviewsView from './SellerReviewsView';
import { toReviewCard, toShopSeller, toTagChips } from './sellerShopFormat';

const REVIEW_PAGE_SIZE = 10;

function getLoadMoreErrorMessage(error) {
  return (
    error.response?.data?.message ?? '리뷰를 더 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
  );
}

// 판매자 상점 · 리뷰 전체 (시안 02-3-3). 누구나 봄 (로그인 필요 없음)
function SellerReviews({ sellerId }) {
  const location = useLocation();
  const [data, setData] = useState(null); // { seller, summary, soldTotal }
  const [loadState, setLoadState] = useState('loading'); // loading | done | notFound | error
  const [reviews, setReviews] = useState([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState('');
  usePageTitle(data ? `${data.seller.nickname}님의 리뷰` : '판매자 리뷰');

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getSeller(sellerId),
      getSellerReviewSummary(sellerId),
      getSellerReviews(sellerId, { page: 0, size: REVIEW_PAGE_SIZE }),
      // 판매자 줄의 판매 완료 수만 씀. 못 불러오면 「-」
      getSellerSoldOutProducts(sellerId, { page: 0, size: 1 }).catch(() => null),
    ])
      .then(([seller, summary, reviewList, sold]) => {
        if (ignore) return;
        setData({
          seller: seller.data.data,
          summary: summary.data.data,
          soldTotal: sold?.data.totalElements ?? null,
        });
        setReviews(reviewList.data.data.content);
        setReviewTotal(reviewList.data.data.totalElements);
        setLoadState('done');
      })
      .catch((error) => {
        if (ignore) return;
        // 404 SELLER_NOT_FOUND: 없는 판매자 (판매자 등록을 안 한 회원 포함)
        setLoadState(error.response?.status === 404 ? 'notFound' : 'error');
      });
    return () => {
      ignore = true;
    };
  }, [sellerId]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setLoadMoreErrorMessage('');
    try {
      const response = await getSellerReviews(sellerId, {
        page: reviewPage + 1,
        size: REVIEW_PAGE_SIZE,
      });
      const page = response.data.data;
      // 보는 중에 새 리뷰가 생기면 페이지가 밀려 같은 리뷰가 다시 올 수 있어 이미 있는 리뷰는 뺌
      setReviews((prev) => {
        const ids = new Set(prev.map((review) => review.reviewId));
        return [...prev, ...page.content.filter((review) => !ids.has(review.reviewId))];
      });
      setReviewPage(reviewPage + 1);
      setReviewTotal(page.totalElements);
    } catch (error) {
      setLoadMoreErrorMessage(getLoadMoreErrorMessage(error));
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (loadState === 'notFound') return <ErrorPage type="NOT_FOUND" />;
  if (loadState === 'error') return <ErrorPage type="SERVER_ERROR" />;
  if (loadState === 'loading') return <main className="flex-1" />;

  const { seller, summary, soldTotal } = data;

  return (
    <SellerReviewsView
      seller={toShopSeller(seller, summary, soldTotal)}
      reviewCountText={`${summary.reviewCount.toLocaleString('ko-KR')}개`}
      tags={toTagChips(summary.tagCounts)}
      reviews={reviews.map(toReviewCard)}
      hasMore={reviews.length < reviewTotal}
      isLoadingMore={isLoadingMore}
      onLoadMore={handleLoadMore}
      loadMoreErrorMessage={loadMoreErrorMessage}
      backTo={`/sellers/${sellerId}`}
      // 상점에서 받은 「처음 들어온 상품」을 그대로 돌려줘 상점의 「‹ 상품 상세」가 계속 맞게 함
      backState={
        location.state?.fromProductId ? { fromProductId: location.state.fromProductId } : undefined
      }
    />
  );
}

function SellerReviewsPage() {
  const { sellerId } = useParams();
  // 판매자가 바뀌면 상태를 새로 시작
  return <SellerReviews key={sellerId} sellerId={sellerId} />;
}

export default SellerReviewsPage;
