import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getOrder, requestReturn, withSellerNicknames } from '../../api/orderApi';
import ErrorPage from '../../components/common/ErrorPage';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatPrice } from '../../utils/format';
import RefundRequestView from './orderDetail/RefundRequestView';
import {
  findOrderItem,
  formatMonthDayTime,
  formatShortDateTime,
  getReturnDeadline,
  getSellerName,
} from './orderDetail/orderDetailModel';
import { EMPTY } from '../../constants/emptyText';

// 반품 신청 실패 code → 안내 (그 밖은 BE message)
const RETURN_ERROR_MESSAGES = {
  RETURN_ALREADY_REQUESTED: '이미 반품을 신청한 상품이에요.',
  RETURN_NOT_REQUESTABLE: '배송 완료된 상품만 반품을 신청할 수 있어요.',
  RETURN_PERIOD_EXPIRED: '반품 신청 기간(배송 완료 후 72시간)이 지났어요.',
};

// 시안 04-3 반품 신청 (주문상품 하나씩, 배송 완료 후 72시간 안 · BE docs/flows/cancel-refund.md)
function RefundRequestPage() {
  usePageTitle('반품 신청');
  const { orderId, orderItemId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, isInitializing } = useAuth();

  const [found, setFound] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error | notFound
  const [reason, setReason] = useState(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    getOrder(orderId)
      .then((response) => withSellerNicknames(response.data.data ?? response.data))
      .then((order) => {
        if (ignore) return;
        const result = findOrderItem(order, orderItemId);
        setFound(result);
        setLoadState(result ? 'done' : 'notFound');
      })
      .catch((err) => {
        if (!ignore) setLoadState(err.response?.status === 404 ? 'notFound' : 'error');
      });
    return () => {
      ignore = true;
    };
  }, [isLoggedIn, orderId, orderItemId]);

  if (isInitializing) return <main className="flex-1" />;
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: `/orders/${orderId}/items/${orderItemId}/return` }} />;
  }
  if (loadState === 'loading') return <main className="flex-1" />;
  if (loadState === 'notFound') return <ErrorPage type="NOT_FOUND" />;
  if (loadState === 'error') return <ErrorPage type="SERVER_ERROR" />;

  const { item, sellerOrder, sellerIndex } = found;
  const deadline = getReturnDeadline(sellerOrder);
  const product = {
    name: item.productName,
    imageUrl: item.thumbnailUrl,
    // 시각이 없으면 「-」, 마감 시각이 없으면 시각 없는 문장
    meta: `판매자 ${getSellerName(sellerOrder, sellerIndex)} · 배송 완료 ${formatShortDateTime(sellerOrder.deliveredAt) ?? EMPTY}`,
    deadline: deadline
      ? `${formatMonthDayTime(deadline)}까지 반품을 신청할 수 있어요`
      : '배송 완료 후 72시간 안에 반품을 신청할 수 있어요',
    price: formatPrice(Number(item.price)),
  };

  const submit = async () => {
    const trimmed = detail.trim();
    // BE: 기타 사유는 직접 작성 내용 필수
    if (reason === 'OTHER' && !trimmed) {
      setError('기타 사유는 상세 설명을 적어 주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await requestReturn(item.id, { reason, detail: trimmed || null });
      navigate(`/orders/${orderId}`, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      setError(
        RETURN_ERROR_MESSAGES[data?.code] ?? data?.message ?? '반품을 신청하지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
      setSubmitting(false);
    }
  };

  return (
    <RefundRequestView
      backTo={`/orders/${orderId}`}
      product={product}
      reason={reason}
      detail={detail}
      submitting={submitting}
      error={error}
      onReasonChange={setReason}
      onDetailChange={setDetail}
      onSubmit={submit}
    />
  );
}

export default RefundRequestPage;
