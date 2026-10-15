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

// 품종 관리 정보 (백엔드 Light · Watering · Difficulty)
export const SPECIES_LIGHT = { LOW: '낮은 광도', MEDIUM: '중간 광도', HIGH: '높은 광도' };
export const SPECIES_WATERING = {
  ALWAYS_WET: '항상 축축하게',
  KEEP_MOIST: '촉촉하게 유지',
  WHEN_SURFACE_DRY: '겉흙이 마르면',
  WHEN_MOSTLY_DRY: '흙이 대부분 마르면',
};
export const SPECIES_DIFFICULTY = { EASY: '쉬움', NORMAL: '보통', HARD: '어려움' };
