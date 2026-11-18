import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getSeller } from '../../api/memberApi';
import { getSellerReviews } from '../../api/reviewApi';
import ErrorPage from '../../components/common/ErrorPage';
import usePageTitle from '../../hooks/usePageTitle';
import { toReviewCard } from '../review/reviewFormat';
import SellerReviewsView from './SellerReviewsView';
import { toShopSeller, toTagChips } from './sellerShopFormat';

const PAGE_SIZE = 10;

function getErrorMessage(error) {
  return error.response?.data?.message ?? '리뷰를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
}

// 판매자 상점 · 리뷰 전체 (시안 02-3-3). 누구나 봄 (로그인 필요 없음)
function SellerReviews({ sellerId }) {
  const location = useLocation();
  const [seller, setSeller] = useState(null);
  const [summary, setSummary] = useState(null); // { averageRating, totalCount, tagCounts }
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loadState, setLoadState] = useState('loading'); // loading | done | notFound | error
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  usePageTitle(seller ? `${seller.nickname}님의 리뷰` : '판매자 리뷰');

  useEffect(() => {
    let ignore = false;
    Promise.all([getSeller(sellerId), getSellerReviews(sellerId, { page: 0, size: PAGE_SIZE })])
      .then(([sellerResponse, reviewResponse]) => {
        if (ignore) return;
        const data = reviewResponse.data;
        setSeller(sellerResponse.data.data);
        setSummary({ averageRating: data.averageRating, totalCount: data.totalCount, tagCounts: data.tagCounts });
        setReviews(data.content);
        setTotalElements(data.totalElements);
        setLoadState('done');
      })
      .catch((error) => {
        if (ignore) return;
        // 404 SELLER_NOT_FOUND: 없는 판매자
        setLoadState(error.response?.status === 404 ? 'notFound' : 'error');
      });
    return () => {
      ignore = true;
    };
  }, [sellerId]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setErrorMessage('');
    try {
      const response = await getSellerReviews(sellerId, { page: page + 1, size: PAGE_SIZE });
      const data = response.data;
      setReviews((prev) => [...prev, ...data.content]);
      setPage(page + 1);
      setTotalElements(data.totalElements);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (loadState === 'notFound') return <ErrorPage type="NOT_FOUND" />;
  if (loadState === 'error') return <ErrorPage type="SERVER_ERROR" />;
  if (loadState === 'loading') return <main className="flex-1" />;

  return (
    <SellerReviewsView
      seller={toShopSeller(seller, summary)}
      // TODO: 리뷰 수는 리뷰 API가 생기면 totalCount로 (지금은 자리 문구)
      reviewCountText={summary.totalCount == null ? '{리뷰 수}개' : `${summary.totalCount.toLocaleString('ko-KR')}개`}
      tags={toTagChips(summary.tagCounts)}
      reviews={reviews.map(toReviewCard)}
      backTo={`/sellers/${sellerId}`}
      backState={location.state?.fromProductId ? { fromProductId: location.state.fromProductId } : undefined}
      hasMore={reviews.length < totalElements}
      isLoadingMore={isLoadingMore}
      onLoadMore={handleLoadMore}
      errorMessage={errorMessage}
    />
  );
}

function SellerReviewsPage() {
  const { sellerId } = useParams();
  // 판매자가 바뀌면 상태를 새로 시작
  return <SellerReviews key={sellerId} sellerId={sellerId} />;
}

export default SellerReviewsPage;
