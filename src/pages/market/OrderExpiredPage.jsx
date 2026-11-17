import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrder } from '../../api/orderApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { OrderExpiredView } from './OrderResultView';

// 시안 03-3-3 결제 시간 만료: 결제 대기 주문을 주문 시각부터 10분 안에 결제하지 못했을 때
// (주문서 카운트다운이 끝났거나, 결제 때 PAYMENT_WINDOW_EXPIRED)
function OrderExpiredPage() {
  usePageTitle('결제 시간 만료');
  const { orderId } = useParams();
  const { isLoggedIn } = useAuth();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    getOrder(orderId)
      .then((response) => {
        if (!ignore) setOrder(response.data.data ?? response.data);
      })
      .catch(() => {}); // 못 불러오면 주문 번호 · 금액 없이 안내만

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, orderId]);

  return <OrderExpiredView orderNo={order?.orderNo} totalAmount={Number(order?.totalAmount ?? 0)} />;
}

export default OrderExpiredPage;
