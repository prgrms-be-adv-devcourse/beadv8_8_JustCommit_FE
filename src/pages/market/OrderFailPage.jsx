import { useLocation } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import { OrderFailView } from './OrderResultView';

// 시안 03-3-2 주문 실패 (409: 다른 분이 먼저 주문했거나 결제 중인 상품이 있음)
// 에러 응답에는 상품 정보가 없어서, 주문서가 장바구니를 다시 조회해 문제 상품을 state로 넘겨 줌
// items: [{ cartItemId, title, price, thumbnailUrl, status }]
// 가격만 바뀐 경우(PRICE_CHANGED)는 이 화면이 아니라 주문서의 가격 변경 모달로 안내
function OrderFailPage() {
  usePageTitle('주문 실패');
  const location = useLocation();
  const items = (location.state?.items ?? []).map((item) => ({ ...item, key: item.cartItemId })); // 새로고침하면 목록 없이 안내만

  return <OrderFailView items={items} />;
}

export default OrderFailPage;
