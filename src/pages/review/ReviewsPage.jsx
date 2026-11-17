import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { deleteReview, getMyReviews, getReceivedReviews, getWritableReviews } from '../../api/reviewApi';
import { ACTION_ERROR } from '../../constants/actionError';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate } from '../../utils/format';
import ReviewsView from './ReviewsView';
import { formatMonthDay, getWritableUntil, isPast, toReviewCard } from './reviewFormat';

const TABS = ['written', 'writable', 'received'];

function toWritten(review) {
  return {
    reviewId: review.reviewId,
    sellerNickname: review.sellerNickname,
    orderedDateText: formatDate(review.orderedAt),
    deletableUntilText: review.deletableUntil && !isPast(review.deletableUntil) ? formatMonthDay(review.deletableUntil) : null,
    card: toReviewCard(review),
  };
}

function toWritable(item) {
  return {
    key: item.sellerOrderId,
    to: `/orders/${item.orderId}/review?sellerOrderId=${item.sellerOrderId}`,
    sellerNickname: item.sellerNickname,
    dateText: `${formatDate(item.orderedAt)} 주문 · 구매 확정 ${formatDate(item.confirmedAt)}`,
    writableUntilText: formatMonthDay(item.writableUntil ?? getWritableUntil(item.confirmedAt)),
    items: item.items,
  };
}

function toReceived(data) {
  const total = data.totalCount;
  return {
    average: Math.floor(data.averageRating * 2) / 2, // 별은 0.5 단위로 내림 (시안: 4.8 → 별 4.5개)
    averageText: data.averageRating.toFixed(1),
    totalCount: total,
    ratingRows: [...data.ratingCounts]
      .sort((a, b) => b.rating - a.rating)
      .map(({ rating, count }) => ({
        label: `${rating.toFixed(1)}점`,
        count,
        percent: total ? Math.round((count / total) * 1000) / 10 : 0,
      })),
    tagCounts: [...data.tagCounts].sort((a, b) => b.count - a.count),
    cards: data.content.map(toReviewCard),
  };
}

function ReviewsPage() {
  usePageTitle('리뷰 관리');
  const { user, isLoggedIn, isInitializing } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSeller = user?.role === 'SELLER';
  const requestedTab = searchParams.get('tab');
  const tab = TABS.includes(requestedTab) && (requestedTab !== 'received' || isSeller) ? requestedTab : 'written';

  const [data, setData] = useState(null); // { written[], writable[], received }
  const [loadError, setLoadError] = useState('');
  const [version, setVersion] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // 탭 숫자를 같이 보여 주므로 세 목록을 한 번에 불러옴
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    Promise.all([getMyReviews(), getWritableReviews(), isSeller ? getReceivedReviews() : Promise.resolve(null)])
      .then(([written, writable, received]) => {
        if (ignore) return;
        setData({
          written: written.data.content,
          writtenTotal: written.data.totalElements,
          writable: writable.data.content,
          writableTotal: writable.data.totalElements,
          received: received ? received.data : null,
        });
      })
      .catch((error) => {
        if (!ignore) setLoadError(error.response?.data?.message ?? '리뷰를 불러오지 못했어요.');
      });
    return () => {
      ignore = true;
    };
  }, [isLoggedIn, isSeller, version]);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteReview(deleteTarget.reviewId);
      setDeleteTarget(null);
      setVersion((v) => v + 1);
    } catch (error) {
      setDeleteError(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isInitializing) return <main className="flex-1" />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/mypage/reviews' }} />;
  if (loadError || !data) {
    return (
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
        <p className="max-w-[960px] mx-auto text-sm text-[#6b7280]" role={loadError ? 'alert' : undefined}>
          {loadError || '리뷰를 불러오는 중...'}
        </p>
      </main>
    );
  }

  return (
    <ReviewsView
      isSeller={isSeller}
      tab={tab}
      onTabChange={(next) => setSearchParams(next === 'written' ? {} : { tab: next }, { replace: true })}
      counts={{
        written: data.writtenTotal,
        writable: data.writableTotal,
        received: data.received?.totalCount ?? 0,
      }}
      written={data.written.map(toWritten)}
      writable={data.writable.map(toWritable)}
      received={data.received ? toReceived(data.received) : null}
      deleteTarget={deleteTarget}
      onDeleteClick={(item) => {
        setDeleteError('');
        setDeleteTarget(item);
      }}
      onDeleteConfirm={handleDeleteConfirm}
      onDeleteCancel={() => setDeleteTarget(null)}
      isDeleting={isDeleting}
      deleteError={deleteError}
    />
  );
}

export default ReviewsPage;
