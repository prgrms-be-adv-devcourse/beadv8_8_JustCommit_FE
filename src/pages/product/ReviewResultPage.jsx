import { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { appealProductReview, getProduct } from '../../api/productApi';
import ErrorPage from '../../components/common/ErrorPage';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDateTime, formatPrice } from '../../utils/format';
import ReviewResultView from './ReviewResultView';

// 검수 중일 때 결과를 다시 확인하는 간격
const POLL_MS = 5000;

// TODO: 검수 결과 API(getProductReview)가 생기면 사유 · 판정 주체 · 기한 · 남은 재검수 횟수를 받아 교체
// 지금은 상품 상태만 보고 화면을 고르고, 나머지 값은 자리 문구로 둠
function toReview(product) {
  if (product.status === 'REVIEW_PENDING') {
    return { stage: 'CHECKING' };
  }
  if (product.status === 'REJECTED') {
    return {
      stage: 'REJECTED',
      reasonTitle: '{반려 사유}',
      reasonHelp: '{반려 사유 설명}',
      decidedByLabel: '{판정 주체}',
      decidedAt: '{판정 시각}',
      reReviewLeft: '{재검수 남은 횟수}',
    };
  }
  return { stage: 'PASSED' };
}

function ReviewResultPage() {
  usePageTitle('검수 결과');
  const { productId } = useParams();
  const { user, isLoggedIn, isInitializing } = useAuth();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [product, setProduct] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error

  const [appealOpen, setAppealOpen] = useState(false);
  const [memo, setMemo] = useState('');
  const [appealError, setAppealError] = useState('');
  const [isAppealing, setIsAppealing] = useState(false);

  const load = useCallback(
    () =>
      getProduct(productId).then((response) => {
        setProduct(response.data.data);
        setLoadState('done');
        return response.data.data;
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
          if (!stopped && data.status === 'REVIEW_PENDING') timer = setTimeout(run, POLL_MS);
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
    } finally {
      setIsAppealing(false);
    }
  };

  return (
    <ReviewResultView
      review={toReview(product)}
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
