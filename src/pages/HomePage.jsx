import { useEffect, useState } from 'react';
import ProductCard from '../components/product/ProductCard';
import SpeciesFilter from '../components/product/SpeciesFilter';
import usePageTitle from '../hooks/usePageTitle';
import { getProducts } from '../api/productApi';
import {
  PRODUCT_SORTS,
  SPECIES_CATEGORIES,
  SPECIES_DIFFICULTY,
  SPECIES_LIGHT,
  SPECIES_WATERING,
} from '../constants/product';
import styles from './HomePage.module.css';

const PAGE_SIZE = 20;

// 빈 문자열('')은 productApi의 compactParams가 요청에서 빼므로 "필터 없음"
const INITIAL_FILTERS = {
  category: '',
  speciesId: '',
  light: '',
  watering: '',
  difficulty: '',
  onSale: '',
  sort: '',
  minPrice: '',
  maxPrice: '',
};

// 관리 조건 필터: 각각 하나만 선택 (백엔드 Light · Watering · Difficulty)
const CARE_FILTERS = [
  { key: 'light', label: '광량', options: SPECIES_LIGHT },
  { key: 'watering', label: '물주기', options: SPECIES_WATERING },
  { key: 'difficulty', label: '난이도', options: SPECIES_DIFFICULTY },
];

const HERO_POINTS = [
  {
    icon: 'account_balance_wallet',
    title: '예치금 안전결제',
    description: '토스페이먼츠로 충전한 예치금으로 결제하고, 결제 금액은 플랫폼이 보관해요.',
  },
  {
    icon: 'payments',
    title: '구매 확정 후 정산',
    description: '구매자가 구매를 확정하면 판매자에게 정산돼요.',
  },
  {
    icon: 'local_shipping',
    title: '배송 완료 3일 뒤 자동 구매 확정',
    description: '배송이 끝나고 3일이 지나면 자동으로 구매 확정돼요.',
  },
];

function getErrorMessage(error) {
  return error.response?.data?.message ?? '상품 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

// 선택 칩 하나 (카테고리·관리 조건 공통)
function FilterChip({ label, isSelected, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={`${styles.chip} ${isSelected ? styles.chipSelected : ''}`}
      onClick={onClick}
    >
      {isSelected && <span className="material-symbols-outlined">check</span>}
      {label}
    </button>
  );
}

function HomePage() {
  usePageTitle();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedSpecies, setSelectedSpecies] = useState(null); // { speciesId, name } — 화면 표시용
  const [priceInput, setPriceInput] = useState({ min: '', max: '' });
  const [priceError, setPriceError] = useState('');

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 정렬을 뺀 조건이 하나라도 있으면 "필터 적용 중"
  const isFiltered = Object.entries(filters).some(([key, value]) => key !== 'sort' && value !== '');
  const hasMore = page + 1 < totalPages;
  const categoryLabel = SPECIES_CATEGORIES.find((item) => item.value === filters.category)?.label;

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  // 필터가 바뀔 때마다 첫 페이지부터 다시 조회
  useEffect(() => {
    let ignore = false;

    async function loadFirstPage() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await getProducts({ ...filters, page: 0, size: PAGE_SIZE });
        if (ignore) return;

        const data = response.data.data;
        setProducts(data.content);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } catch (error) {
        if (!ignore) setErrorMessage(getErrorMessage(error));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadFirstPage();

    return () => {
      ignore = true;
    };
  }, [filters]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);

    try {
      const response = await getProducts({ ...filters, page: page + 1, size: PAGE_SIZE });
      const data = response.data.data;
      setProducts((prev) => [...prev, ...data.content]);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 카테고리를 바꾸면 선택한 품종은 해제 (품종은 카테고리에 속하므로 결과가 0개가 되는 것을 방지)
  const handleCategoryChange = (category) => {
    setFilters((prev) => ({ ...prev, category, speciesId: '' }));
    setSelectedSpecies(null);
  };

  const handleSpeciesSelect = (species) => {
    setSelectedSpecies({ speciesId: species.speciesId, name: species.name });
    updateFilter('speciesId', species.speciesId);
  };

  const handleSpeciesClear = () => {
    setSelectedSpecies(null);
    updateFilter('speciesId', '');
  };

  const handlePriceChange = (key) => (event) => {
    setPriceInput((prev) => ({ ...prev, [key]: event.target.value.replace(/\D/g, '') }));
  };

  const handleApplyPrice = (event) => {
    event.preventDefault();
    const { min, max } = priceInput;

    if (min !== '' && max !== '' && Number(min) > Number(max)) {
      setPriceError('최소 가격이 최대 가격보다 클 수 없습니다.');
      return;
    }

    setPriceError('');
    setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setSelectedSpecies(null);
    setPriceInput({ min: '', max: '' });
    setPriceError('');
  };

  const renderList = () => {
    if (isLoading) {
      return <p className={styles.status}>상품을 불러오는 중...</p>;
    }

    if (errorMessage && products.length === 0) {
      return (
        <div className={styles.empty} role="alert">
          <span className={`material-symbols-outlined ${styles.emptyIcon}`}>error</span>
          <p className={styles.emptyDesc}>{errorMessage}</p>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className={styles.empty}>
          <span className={`material-symbols-outlined ${styles.emptyIcon}`}>potted_plant</span>
          <h3 className={styles.emptyTitle}>
            {isFiltered ? '조건에 맞는 상품이 없습니다' : '등록된 상품이 없습니다'}
          </h3>
          {isFiltered && (
            <>
              <p className={styles.emptyDesc}>필터를 바꾸거나 초기화해 보세요.</p>
              <button type="button" className={styles.outlineButton} onClick={handleReset}>
                <span className="material-symbols-outlined">restart_alt</span>
                필터 초기화
              </button>
            </>
          )}
        </div>
      );
    }

    return (
      <>
        <ul className={styles.grid}>
          {products.map((product) => (
            <li key={product.productId}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>

        {errorMessage && (
          <p className={styles.inlineError} role="alert">
            {errorMessage}
          </p>
        )}

        {hasMore && (
          <div className={styles.more}>
            <button
              type="button"
              className={`${styles.outlineButton} ${styles.moreButton}`}
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? '불러오는 중...' : '더 불러오기'}
              {!isLoadingMore && <span className="material-symbols-outlined">expand_more</span>}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={styles.page}>
      {/* ① 배너 */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroText}>
          <h1 id="hero-title" className={styles.heroTitle}>
            반려식물을 택배로 사고팔아요
          </h1>
          <p className={styles.heroDesc}>모든 거래는 택배로, 결제는 예치금으로만 이뤄져요.</p>
        </div>
        <ul className={styles.heroPoints}>
          {HERO_POINTS.map((point) => (
            <li key={point.title} className={styles.heroPoint}>
              <span className={`material-symbols-outlined ${styles.heroIcon}`} aria-hidden="true">
                {point.icon}
              </span>
              <div>
                <strong>{point.title}</strong>
                <p>{point.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ② 검색 필터 */}
      <section className={styles.filter} aria-label="상품 필터">
        <div className={styles.filterRow}>
          <span id="category-label" className={styles.filterLabel}>
            카테고리
          </span>
          <div className={styles.chips} role="group" aria-labelledby="category-label">
            {SPECIES_CATEGORIES.map((item) => (
              <FilterChip
                key={item.value || 'all'}
                label={item.label}
                isSelected={filters.category === item.value}
                onClick={() => handleCategoryChange(item.value)}
              />
            ))}
          </div>
        </div>

        <div className={styles.filterRow}>
          <span className={styles.filterLabel}>품종</span>
          <SpeciesFilter
            category={filters.category}
            selected={selectedSpecies}
            onSelect={handleSpeciesSelect}
            onClear={handleSpeciesClear}
          />
        </div>

        <div className={styles.divider} />

        <div className={`${styles.filterRow} ${styles.filterRowTop}`}>
          <span className={styles.filterLabel}>관리 조건</span>
          <div className={styles.careGroups}>
            {CARE_FILTERS.map((care) => (
              <div
                key={care.key}
                className={styles.careGroup}
                role="group"
                aria-labelledby={`care-${care.key}`}
              >
                <span id={`care-${care.key}`} className={styles.careLabel}>
                  {care.label}
                </span>
                <div className={styles.chips}>
                  <FilterChip
                    label="전체"
                    isSelected={filters[care.key] === ''}
                    onClick={() => updateFilter(care.key, '')}
                  />
                  {Object.entries(care.options).map(([value, label]) => (
                    <FilterChip
                      key={value}
                      label={label}
                      isSelected={filters[care.key] === value}
                      onClick={() => updateFilter(care.key, value)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.filterBottom}>
          <form className={styles.priceGroup} onSubmit={handleApplyPrice} aria-label="가격 범위">
            <span className={styles.filterLabel}>가격</span>
            <label className={styles.priceField}>
              <input
                inputMode="numeric"
                placeholder="최소"
                aria-label="최소 가격"
                value={priceInput.min}
                onChange={handlePriceChange('min')}
              />
              <span>원</span>
            </label>
            <span className={styles.tilde} aria-hidden="true">
              ~
            </span>
            <label className={styles.priceField}>
              <input
                inputMode="numeric"
                placeholder="최대"
                aria-label="최대 가격"
                value={priceInput.max}
                onChange={handlePriceChange('max')}
              />
              <span>원</span>
            </label>
            <button type="submit" className={styles.outlineButton}>
              적용
            </button>
            {priceError && <p className={styles.priceError}>{priceError}</p>}
          </form>

          <div className={styles.sorts} role="group" aria-label="정렬">
            {PRODUCT_SORTS.map((item) => {
              const isSelected = filters.sort === item.value;
              return (
                <button
                  key={item.value || 'latest'}
                  type="button"
                  aria-pressed={isSelected}
                  className={`${styles.sort} ${isSelected ? styles.sortSelected : ''}`}
                  onClick={() => updateFilter('sort', item.value)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <label className={styles.onSaleToggle}>
            <input
              type="checkbox"
              checked={filters.onSale === 'true'}
              onChange={(event) => updateFilter('onSale', event.target.checked ? 'true' : '')}
            />
            판매 중만
          </label>
        </div>
      </section>

      {/* ③ 상품 목록 */}
      <section className={styles.list} aria-labelledby="list-title">
        <div className={styles.listHeader}>
          <h2 id="list-title" className={styles.listTitle}>
            {selectedSpecies?.name ?? (filters.category ? categoryLabel : '새로 올라온 식물')}
          </h2>
          {!isLoading && <span className={styles.listMeta}>{totalElements}개</span>}
        </div>
        {renderList()}
      </section>
    </div>
  );
}

export default HomePage;
