import { getProduct } from '../../api/productApi';

// 품종 의미 검색 결과(items[].productIds)의 상품을 상품 상세 API로 채움 (문장으로 찾기 · 검색 결과 화면 공통)

// 상품 상세 응답 → 목록 카드(ProductCard) 모양
function toCardProduct(detail) {
  return {
    productId: detail.productId,
    title: detail.title,
    price: detail.price,
    thumbnailUrl: detail.imageUrls?.[0] ?? null,
    status: detail.status,
    createdAt: detail.createdAt,
  };
}

// → { [productId]: 카드 상품 }. 그 사이 숨김 · 삭제돼 조회에 실패한 상품은 뺌
export async function loadSpeciesProducts(items) {
  const productIds = [...new Set(items.flatMap((item) => item.productIds ?? []))];
  const results = await Promise.allSettled(productIds.map((productId) => getProduct(productId)));
  const products = {};
  results.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    const detail = result.value.data.data;
    if (detail.hidden) return;
    products[detail.productId] = toCardProduct(detail);
  });
  return products;
}

// 품종 유사도 순서대로 카드 목록 (같은 상품은 한 번만)
export function orderSpeciesProducts(items, products) {
  const seen = new Set();
  return items
    .flatMap((item) => item.productIds ?? [])
    .filter((productId) => products[productId] && !seen.has(productId) && seen.add(productId))
    .map((productId) => products[productId]);
}
