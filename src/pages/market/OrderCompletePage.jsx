import { useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { getOrder } from '../../api/orderApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { OrderDoneView } from './OrderResultView';

const MESSAGE_CLASS = 'flex-1 max-w-[1240px] w-full mx-auto px-5 py-16 text-center text-[14px] text-[#6b7280]';

// 시안 03-3-1 주문 완료
// 주문서에서 넘어오면 결제 응답(orderNo · totalAmount)을 그대로 쓰고, 새로고침하면 주문 상세를 다시 조회
function OrderCompletePage() {
  usePageTitle('주문 완료');
  const { orderId } = useParams();
  const location = useLocation();
  const { isLoggedIn, isInitializing } = useAuth();

  const passedOrder = location.state?.order;
  const [fetchedOrder, setFetchedOrder] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const order = passedOrder ?? fetchedOrder;

  useEffect(() => {
    if (!isLoggedIn || passedOrder) return undefined;
    let ignore = false;

    getOrder(orderId)
      .then((response) => {
        // 주문 API는 ApiResponse로 감싸지 않고 DTO를 그대로 반환
        if (!ignore) setFetchedOrder(response.data.data ?? response.data);
      })
      .catch(() => {
        if (!ignore) setLoadError(true);
      });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, orderId, passedOrder]);

  if (isInitializing) {
    return <main className={MESSAGE_CLASS}>불러오는 중...</main>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (loadError) {
    return <main className={MESSAGE_CLASS}>주문 정보를 불러오지 못했어요. 주문 목록에서 확인해 주세요.</main>;
  }
  if (!order) {
    return <main className={MESSAGE_CLASS}>불러오는 중...</main>;
  }

  return (
    <OrderDoneView
      orderId={orderId}
      orderNo={order.orderNo}
      totalAmount={Number(order.totalAmount)}
      onCopy={() => navigator.clipboard?.writeText(order.orderNo).catch(() => {})}
    />
  );
}

export default OrderCompletePage;
