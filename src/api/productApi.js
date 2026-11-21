import client from './client';

// 빈 값('', null, undefined)은 빼고 보냄 → 백엔드에서 필터 없음으로 처리
function compactParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  );
}

// status는 여러 개를 배열로 넘김 → status=ACTIVE&status=PAYMENT_PENDING (axios 기본 status[]= 대신)
export function getProducts(params = {}) {
  return client.get('/api/v1/products', { params: compactParams(params), paramsSerializer: { indexes: null } });
}

export function searchSpecies(params) {
  return client.get('/api/v1/species', { params });
}

export function getSpecies(speciesId) {
  return client.get(`/api/v1/species/${speciesId}`);
}

// 업로드 링크 발급: files = [{ contentType, size }] → [{ uploadUrl, imageUrl }]
export function issueImageUploadUrls(files) {
  return client.post('/api/v1/products/images/uploadUrls', { files });
}

export function createProduct(form) {
  return client.post('/api/v1/products', form);
}

// 서명된 링크로 S3에 직접 PUT (공통 client를 쓰면 토큰 헤더·쿠키가 붙어서 fetch 사용)
// contentType: 업로드 링크를 받을 때 보낸 형식과 같아야 서명이 맞음
export async function uploadToPresignedUrl(uploadUrl, file, contentType = file.type) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
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

// 내 상품 상태별 개수 + 오늘 등록 · 사진 검수 횟수와 하루 한도 (BE MyProductCountResponse)
// → { total, reviewPending, rejected, active, paymentPending, soldOut,
//     todayRegistered, dailyRegisterLimit, todayPhotoReviews, dailyPhotoReviewLimit }
// hidden: true면 숨긴 것만, false면 숨기지 않은 것만, 생략하면 전체
export function getMyProductCounts(params = {}) {
  return client.get('/api/v1/products/me/counts', { params: compactParams(params) });
}

// 검수 기록 (판매자 본인, 최신 검수 버전부터, BE SellerImageReviewHistoryResponse)
// → { productId, productStatus, remainingResubmits, appealable, resubmittable,
//     reviews: [{ reviewVersion, scope, status: IN_REVIEW|ADMIN_CHECK|ADMIN_CHECK_DELAYED|APPROVED|REJECTED|REPLACED,
//                 rejectReason, rejectMessage, decidedBy: ENGINE|ADMIN|DEADLINE, appealMemo,
//                 requestedAt, decidedAt, expiresAt }] }
export function getImageReviews(productId) {
  return client.get(`/api/v1/products/${productId}/imageReviews`);
}

// 관리자 확인 기한 초과(REVIEW_EXPIRED)로 반려된 상품을 같은 내용으로 다시 검수 요청
export function resubmitImageReview(productId) {
  return client.post(`/api/v1/products/${productId}/imageReviews`);
}

// 자동 반려 이의 신청 (메모 필수, 200자). BE SellerImageReviewController
export function appealProductReview(productId, memo) {
  return client.post(`/api/v1/products/${productId}/appeals`, { memo });
}

// ===== 판매자 상점 (시안 02-3-1 B안) =====
// 공개 상품 목록(GET products)을 sellerId로 거름. 숨긴 상품은 공개 목록에 나오지 않음
// 응답 → { data: { content: [ProductSearchResponse], totalElements, page, totalPages } } (ApiResponse를 벗긴 모양)

// 판매 중 칸: 판매 중 + 결제 대기(거래 중)
export function getSellerProducts(sellerId, params = {}) {
  return getProducts({ ...params, sellerId, status: ['ACTIVE', 'PAYMENT_PENDING'] }).then((response) => ({
    data: response.data.data,
  }));
}

// 판매 완료 줄 (최신순, page · size)
export function getSellerSoldOutProducts(sellerId, params = {}) {
  return getProducts({ ...params, sellerId, status: 'SOLD_OUT' }).then((response) => ({ data: response.data.data }));
}
