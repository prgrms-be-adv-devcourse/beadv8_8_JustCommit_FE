import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createReview, getOrderReviewStatus } from '../../../api/reviewApi';
import ErrorPage from '../../../components/common/ErrorPage';
import { REVIEW_CONTENT_MAX, REVIEW_CONTENT_MIN } from '../../../constants/review';
import useAuth from '../../../hooks/useAuth';
import usePageTitle from '../../../hooks/usePageTitle';
import ReviewWriteView from './ReviewWriteView';
import { REVIEW_STATUS, toSellerOrderRow } from './reviewModel';

// 등록이 막혔을 때 안내 (BE ReviewErrorCode). 409 · 404는 상태를 다시 불러와 판매자 목록을 고침
const SUBMIT_ERROR_TEXT = {
  REVIEW_ALREADY_WRITTEN: '이미 리뷰를 쓴 판매자예요. 리뷰 상태를 새로 불러왔어요.',
  REVIEW_PERIOD_EXPIRED:
    '리뷰 작성 기간(구매 확정 후 3일)이 지났어요. 리뷰 상태를 새로 불러왔어요.',
  REVIEW_NOT_CONFIRMED: '아직 구매 확정 전인 판매자예요. 리뷰 상태를 새로 불러왔어요.',
  REVIEW_NO_CONFIRMED_ITEM:
    '구매 확정된 상품이 없어 리뷰를 쓸 수 없어요. 리뷰 상태를 새로 불러왔어요.',
  REVIEW_SELLER_ORDER_NOT_FOUND: '리뷰를 쓸 주문을 찾지 못했어요. 리뷰 상태를 새로 불러왔어요.',
};

// 시안 05-2-1 리뷰 작성 · 05-2-2 판매자 선택. 주소: /orders/{orderId}/review?sellerOrderId=
// 주문별 리뷰 상태(GET reviews/orders/{orderId})로 판매자 목록을 그리고, 등록은 sellerOrderId로 (POST reviews)
// 마이페이지 「쓸 수 있는 리뷰」에서 오면 location.state.from = 'mypage' (뒤로 가기를 리뷰 관리로)
function ReviewWritePage() {
  usePageTitle('리뷰 작성');
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, isInitializing } = useAuth();

  const [status, setStatus] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | done | notFound | error
  const [selectedKey, setSelectedKey] = useState(
    () => Number(searchParams.get('sellerOrderId')) || null,
  );
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    getOrderReviewStatus(orderId)
      .then((response) => {
        if (ignore) return;
        setStatus(response.data.data);
        setLoadState('done');
      })
      .catch((error) => {
        if (!ignore) setLoadState(error.response?.status === 404 ? 'notFound' : 'error');
      });
    return () => {
      ignore = true;
    };
  }, [isLoggedIn, orderId]);

  if (isInitializing) return <main className="flex-1" />;
  if (!isLoggedIn) {
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  }
  if (loadState === 'loading') return <main className="flex-1" />;
  if (loadState === 'notFound') return <ErrorPage type="NOT_FOUND" />;
  if (loadState === 'error') return <ErrorPage type="SERVER_ERROR" />;

  const rows = status.sellerOrders.map((sellerOrder) => toSellerOrderRow(sellerOrder));
  // 판매자가 정해져 있으면(주소의 sellerOrderId · 직접 고름 · 등록을 시도함) 그 판매자만 씀.
  // 쓸 수 없는 상태여도 다른 판매자로 바꾸지 않고 이유를 보여 준 뒤 사용자가 직접 고르게 함
  // 정해지지 않았으면 마감이 가장 가까운 판매자(nextWritable)를 기본으로
  const chosenRow = selectedKey == null ? null : rows.find((row) => row.key === selectedKey);
  const selected =
    selectedKey == null
      ? (rows.find((row) => row.key === status.summary.nextWritable?.sellerOrderId) ??
        rows.find((row) => row.writable) ??
        null)
      : (chosenRow ?? null);
  const blockedReason =
    selectedKey == null || chosenRow?.writable
      ? ''
      : (REVIEW_STATUS[chosenRow?.status]?.reason ?? '이 주문에서 찾을 수 없는 판매자예요.');

  const fromMyPage = location.state?.from === 'mypage';
  const back = fromMyPage
    ? { to: '/mypage/reviews?tab=writable', label: '리뷰 관리' }
    : { to: `/orders/${orderId}`, label: '주문 상세' };

  const trimmedLength = content.trim().length;
  const canSubmit =
    rating > 0 && trimmedLength >= REVIEW_CONTENT_MIN && trimmedLength <= REVIEW_CONTENT_MAX;

  const refreshStatus = async () => {
    const response = await getOrderReviewStatus(orderId);
    setStatus(response.data.data);
  };

  const handleSubmit = async () => {
    if (!selected?.writable || blockedReason || !canSubmit) return;
    // 등록 중 409로 상태가 바뀌어도 다른 판매자로 넘어가지 않게 지금 판매자로 고정
    setSelectedKey(selected.key);
    setSubmitting(true);
    setErrorMessage('');
    try {
      await createReview({
        sellerOrderId: selected.sellerOrderId,
        rating,
        content: content.trim(),
        tags,
      });
      // 완료 화면이 주문별 상태를 다시 조회해 남은 판매자를 보여 줌. 뒤로 가기로 같은 글을 다시 보내지 않게 replace
      navigate(`/orders/${orderId}/review/done`, {
        replace: true,
        state: location.state?.from ? { from: location.state.from } : undefined,
      });
    } catch (error) {
      const code = error.response?.data?.code;
      const httpStatus = error.response?.status;
      setErrorMessage(
        SUBMIT_ERROR_TEXT[code] ??
          error.response?.data?.message ??
          '리뷰를 등록하지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
      if (httpStatus === 409 || httpStatus === 404) refreshStatus().catch(() => {});
      setSubmitting(false);
    }
  };

  return (
    <ReviewWriteView
      back={back}
      orderTo={`/orders/${orderId}`}
      rows={rows}
      selected={selected}
      blockedReason={blockedReason}
      hasWritable={rows.some((row) => row.writable)}
      form={{
        rating,
        tags,
        content,
        contentLength: trimmedLength,
        contentTooShort: content.length > 0 && trimmedLength < REVIEW_CONTENT_MIN,
        canSubmit,
        submitting,
        errorMessage,
      }}
      onSelect={(key) => {
        setSelectedKey(key);
        setErrorMessage('');
      }}
      onRate={setRating}
      onToggleTag={(code) =>
        setTags((prev) =>
          prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
        )
      }
      onChangeContent={setContent}
      onSubmit={handleSubmit}
    />
  );
}

export default ReviewWritePage;
