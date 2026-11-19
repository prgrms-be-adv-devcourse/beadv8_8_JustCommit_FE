import { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { appealProductReview, getProduct, getProductImageReviews } from '../../api/productApi';
import ErrorPage from '../../components/common/ErrorPage';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { REVIEW_REJECT_HELP, REVIEW_REJECT_REASON } from '../../constants/seller';
import { formatDateTime, formatPrice } from '../../utils/format';
import ReviewResultView from './ReviewResultView';

// 검수 중일 때 결과를 다시 확인하는 간격
const POLL_MS = 5000;

// 판정 주체 (BE decidedBy) → 화면 문구. 내 판매 목록과 같은 말을 씀
const DECIDED_BY_LABEL = { ENGINE: '자동 판정', ADMIN: '관리자 판정', DEADLINE: '기한 초과' };

// 검수 기록을 못 받았을 때: 상품 상태만 보고 화면을 고르고, 나머지 값은 자리 문구로 둠
function toReviewFromProduct(product) {
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

// 검수 기록(GET products/{productId}/imageReviews) → ReviewResultView의 review
// 최신 검수 버전(REPLACED 제외) 하나로 화면 단계를 고름
function toReview(history, product) {
  const latest = history?.reviews?.find((item) => item.status !== 'REPLACED');
  if (!latest) return toReviewFromProduct(product);

  const expiresAt = latest.expiresAt ? formatDateTime(latest.expiresAt) : '{확인 기한}';
  switch (latest.status) {
    case 'IN_REVIEW':
      return { stage: 'CHECKING' };
    case 'ADMIN_CHECK':
      return { stage: 'MANUAL', expiresAt };
    case 'ADMIN_CHECK_DELAYED':
      return { stage: 'DELAYED', expiresAt };
    case 'APPROVED':
      return { stage: 'PASSED' };
    default:
      break;
  }

  const code = latest.rejectReason;
  let stage = 'REJECTED'; // 자동 반려 → 이의 신청 가능
  if (code === 'REVIEW_EXPIRED') stage = 'EXPIRED';
  else if (latest.decidedBy === 'ADMIN') stage = 'REJECTED_ADMIN';
  return {
    stage,
    reasonTitle: latest.rejectMessage ?? REVIEW_REJECT_REASON[code] ?? '{반려 사유}',
    reasonHelp: REVIEW_REJECT_HELP[code] ?? '{반려 사유 설명}',
    decidedByLabel: DECIDED_BY_LABEL[latest.decidedBy] ?? '{판정 주체}',
    decidedAt: latest.decidedAt ? formatDateTime(latest.decidedAt) : '{판정 시각}',
    reReviewLeft: history.remainingResubmits ?? '{재검수 남은 횟수}',
  };
}

function ReviewResultPage() {
  usePageTitle('검수 결과');
  const { productId } = useParams();
  const { user, isLoggedIn, isInitializing } = useAuth();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error

  const [appealOpen, setAppealOpen] = useState(false);
  const [memo, setMemo] = useState('');
  const [appealError, setAppealError] = useState('');
  const [isAppealing, setIsAppealing] = useState(false);

  // 상품 + 검수 기록. 검수 기록이 실패하면 상품 상태만으로 화면을 고름 (toReviewFromProduct)
  const load = useCallback(
    () =>
      Promise.all([
        getProduct(productId),
        getProductImageReviews(productId).catch(() => null),
      ]).then(([productResponse, historyResponse]) => {
        setProduct(productResponse.data.data);
        setHistory(historyResponse?.data.data ?? null);
        setLoadState('done');
        return productResponse.data.data;
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
      review={toReview(history, product)}
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
