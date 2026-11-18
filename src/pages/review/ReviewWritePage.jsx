import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getOrder } from '../../api/orderApi';
import { createReview } from '../../api/reviewApi';
import { ACTION_ERROR } from '../../constants/actionError';
import { REVIEW_CONTENT_MAX, REVIEW_CONTENT_MIN } from '../../constants/review';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import ReviewWriteView from './ReviewWriteView';
import { toReviewSeller } from './reviewFormat';

function ReviewWritePage() {
  usePageTitle('리뷰 작성');
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, isInitializing } = useAuth();

  const [sellers, setSellers] = useState(null); // null = 로딩 중
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    getOrder(orderId)
      .then((response) => {
        if (ignore) return;
        const order = response.data.data ?? response.data;
        // 구매 확정된 판매자 주문 중 작성 기간이 남은 것만 (이미 쓴 것은 메뉴에 「작성 완료」로)
        const list = (order.sellerOrders ?? [])
          .filter((sellerOrder) => sellerOrder.confirmedAt)
          .map(toReviewSeller)
          .filter((seller) => seller.written || !seller.expired);
        setSellers(list);
        const wanted = Number(searchParams.get('sellerOrderId'));
        const first = list.find((seller) => seller.sellerOrderId === wanted && !seller.written) ?? list.find((seller) => !seller.written);
        setSelectedId(first?.sellerOrderId ?? null);
      })
      .catch((error) => {
        if (!ignore) setLoadError(error.response?.data?.message ?? '주문을 불러오지 못했어요.');
      });
    return () => {
      ignore = true;
    };
  }, [isLoggedIn, orderId, searchParams]);

  const resetForm = () => {
    setRating(0);
    setTags([]);
    setContent('');
    setSubmitError('');
  };

  const trimmedLength = content.trim().length;
  const canSubmit = rating > 0 && trimmedLength >= REVIEW_CONTENT_MIN && trimmedLength <= REVIEW_CONTENT_MAX;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await createReview({ sellerOrderId: selectedId, rating, tags, content: content.trim() });
      // 남은 판매자는 완료 화면에서 안내
      const remaining = sellers.filter((seller) => !seller.written && seller.sellerOrderId !== selectedId);
      navigate(`/orders/${orderId}/review/done`, {
        replace: true,
        state: { remaining: remaining.map(({ sellerOrderId, sellerNickname, untilText }) => ({ sellerOrderId, sellerNickname, untilText })) },
      });
    } catch (error) {
      setSubmitError(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
      setIsSubmitting(false);
    }
  };

  if (isInitializing) return <main className="flex-1" />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: `/orders/${orderId}/review` }} />;

  const selected = sellers?.find((seller) => seller.sellerOrderId === selectedId);
  if (loadError || !sellers || !selected) {
    let message = '주문을 불러오는 중...';
    if (loadError) message = loadError;
    else if (sellers) message = '지금 쓸 수 있는 리뷰가 없어요.';
    return (
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
        <p className="max-w-[720px] mx-auto text-sm text-[#6b7280]" role={loadError ? 'alert' : undefined}>
          {message}
        </p>
      </main>
    );
  }

  return (
    <ReviewWriteView
      backTo={`/orders/${orderId}`}
      sellers={sellers}
      selected={selected}
      menuOpen={menuOpen}
      onToggleMenu={() => setMenuOpen((open) => !open)}
      onSelect={(id) => {
        if (id !== selectedId) resetForm();
        setSelectedId(id);
        setMenuOpen(false);
      }}
      rating={rating}
      onRatingChange={setRating}
      tags={tags}
      onToggleTag={(code) => setTags((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))}
      content={content}
      onContentChange={setContent}
      canSubmit={canSubmit}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitError={submitError}
    />
  );
}

export default ReviewWritePage;
