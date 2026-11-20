import { getSellerOrder, getSellerOrders, mapWithLimit } from '../../api/orderApi';
import { getSalesOrderStatus } from '../../constants/seller';

// 판매 주문 목록·상세를 불러오는 함수들
// 사진은 판매 주문 응답(thumbnailUrl)에 있어서 상품 API를 따로 부르지 않음

const PAGE_SIZE = 50; // 백엔드 PagingRequest.MAX_SIZE
const MAX_PAGES = 10; // 안전장치: 최대 500건까지

// 주문 API는 ApiResponse로 감싸지 않고 바로 내려옴 → 둘 다 처리
function unwrap(response) {
  return response.data.data ?? response.data;
}

/**
 * 판매 주문 전체
 * 구매 확정 여부는 목록 응답의 confirmedAt(판매자 주문 단위)으로 판단해서 상세를 따로 부르지 않음
 */
export async function fetchSalesOrders() {
  const orders = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = unwrap(await getSellerOrders({ page, size: PAGE_SIZE }));
    orders.push(...data.content);
    if (page + 1 >= data.totalPages) break;
  }
  return orders;
}

/**
 * 판매 주문 상세 (상품 사진은 응답에 포함)
 */
export async function fetchSalesOrder(sellerOrderId) {
  return unwrap(await getSellerOrder(sellerOrderId));
}

const DETAIL_CONCURRENCY = 4; // 판매 주문 상세를 동시에 부르는 수
const SHIPPING_STATUSES = ['PICKUP', 'SHIPPING', 'DELIVERED']; // 목록에 송장번호를 보여 주는 단계

/**
 * 송장번호: 판매 주문 목록 응답(SellerOrderResponse)에는 없고 상세(trackingNo)에만 있어
 * 배송 단계(픽업 대기 · 배송 중 · 배송 완료)인 주문만 상세를 불러 붙임. 실패한 주문은 그대로 (자리 문구)
 */
export async function attachTrackingNos(orders) {
  return mapWithLimit(orders, DETAIL_CONCURRENCY, async (order) => {
    if (order.trackingNo || !SHIPPING_STATUSES.includes(getSalesOrderStatus(order))) return order;
    try {
      const detail = await fetchSalesOrder(order.sellerOrderId);
      return detail?.trackingNo ? { ...order, trackingNo: detail.trackingNo } : order;
    } catch {
      return order;
    }
  });
}
