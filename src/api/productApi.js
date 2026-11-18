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

export function getSpecies(speciesId) {
  return client.get(`/api/v1/species/${speciesId}`);
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

// 판매 상품 목록 (숨긴 상품 포함, 삭제된 상품 제외)
export function getMyProducts(params = {}) {
  return client.get('/api/v1/products/me', { params: compactParams(params) });
}

// 숨기기·숨김 해제 (삭제된 상품 말고는 모든 상태에서 가능, 시안 08-4-1)
export function changeProductHidden(productId, hidden) {
  return client.patch(`/api/v1/products/${productId}/hidden`, { hidden });
}

// 삭제 (판매중만 가능, 백엔드는 상태만 DELETED로 바꿈)
export function deleteProduct(productId) {
  return client.delete(`/api/v1/products/${productId}`);
}

// 상품 수정 (판매중인 내 상품만, 요청 형식은 등록과 같음)
export function updateProduct(productId, form) {
  return client.put(`/api/v1/products/${productId}`, form);
}

// TODO: 백엔드 API가 아직 없음 (docs/reference/external-apis.md 「추가 예정」 · products/me/counts)
// 경로 · 응답은 담당이 확정하면 맞춥니다. 조회 함수는 아직 부르지 않고 화면에 자리 문구를 씁니다.
// 이의 신청은 버튼을 누르면 부릅니다 (API가 없으면 실패 안내가 보임).

// 등록 제한 현황 → { reviewingCount, reviewingLimit, registeredToday, registerLimit, reviewedToday, reviewLimit }
export function getMyProductQuota() {
  return client.get('/api/v1/products/me/quota');
}

// 내 상품 상태별 개수 (전체 · 판매 중 · 거래 중 · 판매 완료 · 검수 중 · 반려 · 숨김)
export function getMyProductCounts() {
  return client.get('/api/v1/products/me/counts');
}

// 검수 결과 → { stage: CHECKING|MANUAL|DELAYED|PASSED|REJECTED, rejectReason, decidedBy: AUTO|ADMIN,
//              decidedAt, expiresAt, reReviewLeft, appealable }
export function getProductReview(productId) {
  return client.get(`/api/v1/products/${productId}/review`);
}

// 자동 반려 이의 신청 (메모 필수, 200자)
export function appealProductReview(productId, memo) {
  return client.post(`/api/v1/products/${productId}/review/appeal`, { memo });
}

// ===== 판매자 상점 (시안 02-3-1 B안) =====
// TODO: 판매자별 판매 중 상품 목록 API가 없음. GET products(ProductSearchRequest)에 sellerId 필터가 없고,
//  BE docs/reference/external-apis.md 「추가할 API」의 market 「확장 화면은 판매자 상점(리뷰 · 판매 상품)」에 해당.
//  경로 · 응답이 정해지면 실제 호출로 바꿉니다 (예: GET /api/v1/products?sellerId= 또는 /api/v1/sellers/{sellerId}/products).
//  지금은 서버를 부르지 않고 빈 목록을 돌려줍니다 → 화면은 「판매 중 0개」 빈 상태로 보임.
// 응답 → { content: [{ productId, title, price, thumbnailUrl, status, createdAt }], totalElements }
// eslint-disable-next-line no-unused-vars
export function getSellerProducts(sellerId, params = {}) {
  return Promise.resolve({ data: { content: [], totalElements: 0 } });
}

// TODO: 판매자별 판매 완료 상품 목록 API가 없음 (판매자 상점 B안 「판매 완료」 줄, 시안 02-3-1).
//  필요한 조건: sellerId 필터 + status=SOLD_OUT 필터 + 숨긴 상품(hidden) 제외, 최신순, page · size(6개씩).
//  근거: BE docs/services/product.md 「상태」 SOLD_OUT · 「숨김」(판매자 본인만 봄).
//  경로 · 응답이 정해지면 실제 호출로 바꿉니다 (예: GET /api/v1/products?sellerId=&status=SOLD_OUT&page=&size=).
//  지금은 서버를 부르지 않고 빈 목록을 돌려줍니다. totalElements = null(모름) → 화면은 개수에 {판매 완료 수} 자리 문구.
// 응답 → { content: [{ productId, title, price, thumbnailUrl, status: 'SOLD_OUT', createdAt }], totalElements }
// eslint-disable-next-line no-unused-vars
export function getSellerSoldOutProducts(sellerId, params = {}) {
  return Promise.resolve({ data: { content: [], totalElements: null } });
}
