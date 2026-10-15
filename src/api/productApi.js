import client from './client';

// 빈 값('', null, undefined)은 빼고 보냄 → 백엔드에서 필터 없음으로 처리
function compactParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  );
}

export function getProducts(params = {}) {
  return client.get('/api/v1/products', { params: compactParams(params) });
}
