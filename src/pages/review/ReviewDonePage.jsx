import { Navigate, useLocation, useParams } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import ReviewDoneView from './ReviewDoneView';

// 리뷰 등록 후 이동하는 화면. 남은 판매자는 작성 화면이 navigate state로 넘겨 줌
// (새로고침 등으로 state가 없으면 주문 상세로 돌아감)
function ReviewDonePage() {
  usePageTitle('리뷰 등록 완료');
  const { orderId } = useParams();
  const { state } = useLocation();

  if (!state?.remaining) return <Navigate to={`/orders/${orderId}`} replace />;

  const [first] = state.remaining;
  return (
    <ReviewDoneView
      orderTo={`/orders/${orderId}`}
      remainingCount={state.remaining.length}
      next={
        first
          ? {
              sellerNickname: first.sellerNickname,
              untilText: first.untilText,
              to: `/orders/${orderId}/review?sellerOrderId=${first.sellerOrderId}`,
            }
          : null
      }
    />
  );
}

export default ReviewDonePage;
