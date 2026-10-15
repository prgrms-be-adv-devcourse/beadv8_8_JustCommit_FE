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

export function searchSpecies(params) {
  return client.get('/api/v1/species', { params });
}

// 업로드 링크 발급: files = [{ contentType, size }] → [{ uploadUrl, imageUrl }]
export function issueImageUploadUrls(files) {
  return client.post('/api/v1/products/images/upload-urls', { files });
}

export function createProduct(form) {
  return client.post('/api/v1/products', form);
}

// 서명된 링크로 S3에 직접 PUT (공통 client를 쓰면 토큰 헤더·쿠키가 붙어서 fetch 사용)
export async function uploadToPresignedUrl(uploadUrl, file) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`이미지 업로드 실패 (${response.status})`);
  }
}

export function getProduct(productId) {
  return client.get(`/api/v1/products/${productId}`);
}
