import { getSellerOrder, getSellerOrders } from '../../api/orderApi';
import { getProduct } from '../../api/productApi';

// 판매 주문 API 응답에 없는 값(구매자·상품 상태·사진·품종)을 기존 API로 채우는 함수들
// TODO: 백엔드 판매 주문 응답에 이 값들이 생기면 추가 요청 없이 바로 사용

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
 * 상품 ID 목록 → Map(productId → { thumbnailUrl, speciesName })
 * 삭제 등으로 조회에 실패한 상품은 빠짐 (대체 썸네일 표시)
 */
export async function fetchProductSummaries(productIds) {
  const ids = [...new Set(productIds.filter(Boolean))];
  const products = await mapWithLimit(ids, CONCURRENCY, async (id) => unwrap(await getProduct(id)));
  const summaries = new Map();
  products.forEach((product, index) => {
    if (!product) return;
    summaries.set(ids[index], {
      thumbnailUrl: product.imageUrls?.[0],
      speciesName: product.species?.name,
    });
  });
  return summaries;
}

/**
 * 판매 주문 전체 + 주문별 상세(구매자 이름·상품 상태) + 대표 상품 사진
 * 목록 응답엔 구매자·상품 상태가 없어서 주문마다 상세를 한 번 더 조회
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
  const products = await fetchProductSummaries(
    details.map((detail) => detail?.items?.[0]?.productId),
  );

  return orders.map((order, index) => {
    const detail = details[index];
    const firstProductId = detail?.items?.[0]?.productId;
    return {
      ...order,
      buyerName: detail?.recipientName,
      items: detail?.items,
      // 서버가 주는 대표 사진 우선, 없으면 상품 조회 값
      thumbnailUrl: order.thumbnailUrl ?? products.get(firstProductId)?.thumbnailUrl,
    };
  });
}

/**
 * 판매 주문 상세 + 상품별 사진·품종
 */
export async function fetchSalesOrder(sellerOrderId) {
  const order = unwrap(await getSellerOrder(sellerOrderId));
  const products = await fetchProductSummaries((order.items ?? []).map((item) => item.productId));
  return {
    ...order,
    items: (order.items ?? []).map((item) => {
      const summary = products.get(item.productId);
      // 서버가 주는 사진 우선, 없으면 상품 조회 값
      return { ...item, ...summary, thumbnailUrl: item.thumbnailUrl ?? summary?.thumbnailUrl };
    }),
  };
}
