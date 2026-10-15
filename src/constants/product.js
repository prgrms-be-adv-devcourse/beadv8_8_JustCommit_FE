// 품종 분류 (백엔드 SpeciesCategory)
export const SPECIES_CATEGORIES = [
  { value: '', label: '전체' },
  { value: 'FOLIAGE', label: '관엽식물' },
  { value: 'FOLIAGE_FLOWER', label: '잎·꽃 식물' },
  { value: 'FLOWER', label: '꽃 식물' },
  { value: 'FRUIT', label: '열매 식물' },
  { value: 'SUCCULENT', label: '다육·선인장' },
];

// 정렬 (백엔드 ProductSearchRequest.sort)
export const PRODUCT_SORTS = [
  { value: '', label: '최신순' },
  { value: 'priceAsc', label: '낮은 가격순' },
  { value: 'priceDesc', label: '높은 가격순' },
];

// 상품 상태 (백엔드 ProductStatus)
export const PRODUCT_STATUS = {
  ACTIVE: { label: '판매중', tone: 'active' },
  PAYMENT_PENDING: { label: '결제 대기', tone: 'pending' },
  SOLD_OUT: { label: '판매완료', tone: 'soldOut' },
};
