import { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { appealProductReview, getImageReviews, getProduct, resubmitImageReview } from '../../api/productApi';
import ErrorPage from '../../components/common/ErrorPage';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDateTime, formatPrice } from '../../utils/format';
import ReviewResultView from './ReviewResultView';
import { toReviewResult } from './reviewStatusModel';

// 검수 중일 때 결과를 다시 확인하는 간격
const POLL_MS = 5000;

// 그사이 상태가 바뀌어 409가 나는 경우 (다른 탭에서 이미 신청 · 수정 등) → 화면을 다시 불러 버튼을 맞춤
// REVIEW_PENDING_LIMIT_EXCEEDED는 상태가 그대로라 문구만 보여 줌
const STALE_STATE_CODES = ['APPEAL_ALREADY_USED', 'APPEAL_NOT_ALLOWED', 'RESUBMIT_NOT_ALLOWED'];

function isStaleState(error) {
  return error.response?.status === 409 && STALE_STATE_CODES.includes(error.response?.data?.code);
}

function ReviewResultPage() {
  usePageTitle('검수 결과');
  const { productId } = useParams();
  const { user, isLoggedIn, isInitializing } = useAuth();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState(null); // 검수 기록 (GET products/{id}/imageReviews)
  const [loadState, setLoadState] = useState('loading'); // loading | done | error

  const [appealOpen, setAppealOpen] = useState(false);
  const [memo, setMemo] = useState('');
  const [appealError, setAppealError] = useState('');
  const [isAppealing, setIsAppealing] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState('');

  const load = useCallback(
    () =>
      Promise.all([getProduct(productId), getImageReviews(productId)]).then(([productResponse, historyResponse]) => {
        const nextHistory = historyResponse.data.data;
        setProduct(productResponse.data.data);
        setHistory(nextHistory);
        setLoadState('done');
        return nextHistory;
      }),
    [productId],
  );

  useEffect(() => {
    if (!canSell) return undefined;
    let timer = null;
    let stopped = false;
    const run = () =>
      load()
        .then((data) => {
          // 자동 검수 중일 때만 다시 확인 (관리자 확인은 오래 걸려 알림으로 알려 줌)
          if (!stopped && toReviewResult(data).stage === 'CHECKING') timer = setTimeout(run, POLL_MS);
        })
        .catch(() => {
          if (!stopped) setLoadState('error');
        });
    run();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [canSell, load]);

  const closeAppeal = useCallback(() => {
    if (!isAppealing) setAppealOpen(false);
  }, [isAppealing]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!canSell) return <Navigate to="/seller/register" replace />;
  if (loadState === 'loading') return <main className="flex-1" />;
  if (loadState === 'error') return <ErrorPage type="PRODUCT_NOT_FOUND" />;
  if (product.sellerId !== user.memberId) return <ErrorPage type="FORBIDDEN" />;

  const handleAppeal = async () => {
    setIsAppealing(true);
    setAppealError('');
    try {
      await appealProductReview(productId, memo.trim());
      setAppealOpen(false);
      setMemo('');
      await load();
    } catch (error) {
      setAppealError(error.response?.data?.message ?? '이의 신청을 하지 못했어요. 잠시 후 다시 시도해 주세요.');
      if (isStaleState(error)) load().catch(() => {});
    } finally {
      setIsAppealing(false);
    }
  };

  // 기한 초과 반려 → 같은 내용으로 다시 검수 요청
  const handleResubmit = async () => {
    setIsResubmitting(true);
    setResubmitError('');
    try {
      await resubmitImageReview(productId);
      await load();
    } catch (error) {
      setResubmitError(error.response?.data?.message ?? '다시 검수를 요청하지 못했어요. 잠시 후 다시 시도해 주세요.');
      if (isStaleState(error)) load().catch(() => {});
    } finally {
      setIsResubmitting(false);
    }
  };

  return (
    <ReviewResultView
      review={toReviewResult(history, product.status)}
      resubmit={{ onSubmit: handleResubmit, isSubmitting: isResubmitting, errorMessage: resubmitError }}
      product={{
        productId,
        title: product.title,
        speciesName: product.species?.name ?? '',
        priceText: formatPrice(product.price),
        createdAtText: product.createdAt ? formatDateTime(product.createdAt) : '',
        photos: product.imageUrls ?? [],
      }}
      appeal={{
        isOpen: appealOpen,
        memo,
        onMemoChange: setMemo,
        errorMessage: appealError,
        isSubmitting: isAppealing,
        onOpen: () => {
          setAppealError('');
          setAppealOpen(true);
        },
        onClose: closeAppeal,
        onSubmit: handleAppeal,
      }}
    />
  );
}

export default ReviewResultPage;
