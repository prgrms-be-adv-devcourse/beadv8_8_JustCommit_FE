import { getSellerOrder, getSellerOrders } from '../../api/orderApi';

// 판매 주문 목록·상세를 불러오는 함수들
// 사진은 판매 주문 응답(thumbnailUrl)에 있어서 상품 API를 따로 부르지 않음

const PAGE_SIZE = 50; // 백엔드 PagingRequest.MAX_SIZE
const MAX_PAGES = 10; // 안전장치: 최대 500건까지
const CONCURRENCY = 6; // 한 번에 보내는 추가 요청 수

// 주문 API는 ApiResponse로 감싸지 않고 바로 내려옴 → 둘 다 처리
function unwrap(response) {
  return response.data.data ?? response.data;
}

// list를 limit개씩 나눠 요청 (실패한 항목은 null)
async function mapWithLimit(list, limit, fn) {
  const results = new Array(list.length).fill(null);
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const index = next;
      next += 1;
      try {
        results[index] = await fn(list[index]);
      } catch {
        results[index] = null;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return results;
}

/**
 * 판매 주문 전체 + 주문별 상품 상태
 * 목록 응답의 status는 주문 전체 상태라서, 판매자 몫 상품이 모두 구매 확정됐는지 알려면
 * 주문마다 상세의 상품 상태(items[].status)가 필요함
 * TODO: 목록 응답에 판매자 주문 확정 여부(confirmedAt)가 생기면 상세 조회 없이 판단
 */
export async function fetchSalesOrders() {
  const orders = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = unwrap(await getSellerOrders({ page, size: PAGE_SIZE }));
    orders.push(...data.content);
    if (page + 1 >= data.totalPages) break;
  }

  const details = await mapWithLimit(orders, CONCURRENCY, async (order) =>
    unwrap(await getSellerOrder(order.sellerOrderId)),
  );

  return orders.map((order, index) => ({ ...order, items: details[index]?.items }));
}

/**
 * 판매 주문 상세 (상품 사진은 응답에 포함)
 */
export async function fetchSalesOrder(sellerOrderId) {
  return unwrap(await getSellerOrder(sellerOrderId));
}
