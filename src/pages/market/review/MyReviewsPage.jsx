import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  deleteReview,
  getMyReviews,
  getSellerReviewSummary,
  getSellerReviews,
  getWritableReviews,
} from '../../../api/reviewApi';
import useAuth from '../../../hooks/useAuth';
import usePageTitle from '../../../hooks/usePageTitle';
import { toReviewCard, toTagChips } from '../../member/sellerShopFormat';
import MyReviewsView from './MyReviewsView';
import { buildReceivedSummary, tagLabels, toMyReviewItem, toWritableItem } from './reviewModel';

const PAGE_SIZE = 10;
const TABS = ['written', 'writable', 'received'];

const LOAD_MORE_ERROR = '리뷰를 더 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
const DELETE_ERROR_TEXT = {
  REVIEW_DELETE_PERIOD_EXPIRED: '삭제할 수 있는 기간(작성 후 3일)이 지났어요.',
};

// 페이지를 이어 붙일 때 보는 중에 생긴 · 지운 리뷰 때문에 같은 리뷰가 다시 오면 뺌
function appendUnique(prev, next) {
  const ids = new Set(prev.map((review) => review.reviewId));
  return [...prev, ...next.filter((review) => !ids.has(review.reviewId))];
}

const EMPTY_LIST = {
  loadState: 'loading',
  items: [],
  total: 0,
  page: 0,
  isLoadingMore: false,
  loadMoreError: '',
};

// 시안 05-3 리뷰 관리. 주소: /mypage/reviews?tab=written | writable | received (탭은 주소에 남겨 새로고침해도 유지)
// 받은 리뷰는 판매자만 (공개 목록 · 집계 API를 내 회원 번호 = 판매자 번호로 부름)
function MyReviewsPage() {
  usePageTitle('리뷰 관리');
  const { user, isLoggedIn, isInitializing } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSeller = user?.role === 'SELLER';
  const requestedTab = searchParams.get('tab');
  const activeTab =
    TABS.includes(requestedTab) && (requestedTab !== 'received' || isSeller)
      ? requestedTab
      : 'written';

  // 삭제 가능 여부(deletableUntil 전)를 가르는 기준 시각. 삭제 실패 때 다시 잼
  const [now, setNow] = useState(() => Date.now());
  const [written, setWritten] = useState(EMPTY_LIST);
  const [writable, setWritable] = useState({ loadState: 'loading', items: [] });
  const [received, setReceived] = useState({ ...EMPTY_LIST, summary: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // 탭 숫자를 위해 세 탭을 처음에 한꺼번에 불러옴 (하나가 실패해도 나머지는 보임)
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    getMyReviews({ page: 0, size: PAGE_SIZE })
      .then((response) => {
        const page = response.data.data;
        if (!ignore)
          setWritten({
            ...EMPTY_LIST,
            loadState: 'done',
            items: page.content,
            total: page.totalElements,
          });
      })
      .catch(() => {
        if (!ignore) setWritten({ ...EMPTY_LIST, loadState: 'error' });
      });
    getWritableReviews()
      .then((response) => {
        if (!ignore) setWritable({ loadState: 'done', items: response.data.data });
      })
      .catch(() => {
        if (!ignore) setWritable({ loadState: 'error', items: [] });
      });
    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  const sellerId = isSeller ? user.memberId : null;
  useEffect(() => {
    if (!sellerId) return undefined;
    let ignore = false;
    Promise.all([
      getSellerReviewSummary(sellerId),
      getSellerReviews(sellerId, { page: 0, size: PAGE_SIZE }),
    ])
      .then(([summary, list]) => {
        if (ignore) return;
        const page = list.data.data;
        setReceived({
          ...EMPTY_LIST,
          loadState: 'done',
          summary: summary.data.data,
          items: page.content,
          total: page.totalElements,
        });
      })
      .catch(() => {
        if (!ignore) setReceived({ ...EMPTY_LIST, loadState: 'error', summary: null });
      });
    return () => {
      ignore = true;
    };
  }, [sellerId]);

  if (isInitializing) return <main className="flex-1" />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/mypage/reviews' }} />;

  const loadMore = async (list, setList, fetchPage) => {
    setList((prev) => ({ ...prev, isLoadingMore: true, loadMoreError: '' }));
    try {
      const response = await fetchPage(list.page + 1);
      const page = response.data.data;
      setList((prev) => ({
        ...prev,
        items: appendUnique(prev.items, page.content),
        total: page.totalElements,
        page: prev.page + 1,
        isLoadingMore: false,
      }));
    } catch {
      setList((prev) => ({ ...prev, isLoadingMore: false, loadMoreError: LOAD_MORE_ERROR }));
    }
  };

  const closeDelete = () => {
    setDeleteTarget(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    const { reviewId } = deleteTarget;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteReview(reviewId);
      // 지운 리뷰를 목록에서 빼고 「내가 쓴 리뷰」 숫자를 줄임 (삭제한 주문은 쓸 수 있는 리뷰에도 다시 나오지 않음)
      setWritten((prev) => ({
        ...prev,
        items: prev.items.filter((review) => review.reviewId !== reviewId),
        total: Math.max(prev.total - 1, 0),
      }));
      closeDelete();
    } catch (error) {
      const code = error.response?.data?.code;
      if (error.response?.status === 404) {
        // 이미 지워진 리뷰: 목록에서 빼고 닫음
        setWritten((prev) => ({
          ...prev,
          items: prev.items.filter((review) => review.reviewId !== reviewId),
          total: Math.max(prev.total - 1, 0),
        }));
        closeDelete();
      } else {
        setDeleteError(
          DELETE_ERROR_TEXT[code] ??
            error.response?.data?.message ??
            '리뷰를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.',
        );
        // 기한이 지났으면 삭제 버튼이 사라지도록 기준 시각을 다시 잼
        if (code === 'REVIEW_DELETE_PERIOD_EXPIRED') setNow(Date.now());
      }
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    {
      key: 'written',
      label: '내가 쓴 리뷰',
      count: written.loadState === 'done' ? written.total : undefined,
    },
    {
      key: 'writable',
      label: '쓸 수 있는 리뷰',
      count: writable.loadState === 'done' ? writable.items.length : undefined,
    },
  ];
  if (isSeller) {
    tabs.push({
      key: 'received',
      label: '받은 리뷰',
      count: received.loadState === 'done' ? received.summary.reviewCount : undefined,
    });
  }

  return (
    <MyReviewsView
      tabs={tabs}
      activeTab={activeTab}
      onChangeTab={(tab) => setSearchParams({ tab }, { replace: true })}
      written={{
        loadState: written.loadState,
        items: written.items.map((review) => toMyReviewItem(review, user.nickname, now)),
        hasMore: written.items.length < written.total,
        isLoadingMore: written.isLoadingMore,
        loadMoreError: written.loadMoreError,
      }}
      writable={{ loadState: writable.loadState, items: writable.items.map(toWritableItem) }}
      received={{
        loadState: received.loadState,
        summary: received.summary && buildReceivedSummary(received.summary),
        tagChips: toTagChips(received.summary?.tagCounts),
        cards: received.items.map((review) => ({
          ...toReviewCard(review),
          tags: tagLabels(review.tags),
        })),
        hasMore: received.items.length < received.total,
        isLoadingMore: received.isLoadingMore,
        loadMoreError: received.loadMoreError,
      }}
      onLoadMoreWritten={() =>
        loadMore(written, setWritten, (page) => getMyReviews({ page, size: PAGE_SIZE }))
      }
      onLoadMoreReceived={() =>
        loadMore(received, setReceived, (page) =>
          getSellerReviews(sellerId, { page, size: PAGE_SIZE }),
        )
      }
      deleteTarget={deleteTarget}
      deleting={deleting}
      deleteError={deleteError}
      onOpenDelete={(item) =>
        setDeleteTarget({ reviewId: item.reviewId, sellerName: item.sellerName })
      }
      onCloseDelete={closeDelete}
      onConfirmDelete={confirmDelete}
    />
  );
}

export default MyReviewsPage;
