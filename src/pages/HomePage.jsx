import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import SpeciesFilter from '../components/product/SpeciesFilter';
import usePageTitle from '../hooks/usePageTitle';
import { getProducts, getSpecies } from '../api/productApi';
import {
  PRODUCT_SORTS,
  SPECIES_CATEGORIES,
  SPECIES_DIFFICULTY,
  SPECIES_LIGHT,
  SPECIES_WATERING,
} from '../constants/product';
import styles from './HomePage.module.css';

const PAGE_SIZE = 20;

// 필터는 URL 쿼리(?category=…&sort=…)에 저장 → 새로고침·뒤로 가기·링크 공유 시에도 유지
// 빈 문자열('')은 URL에서 빠지고, productApi의 compactParams도 요청에서 빼므로 "필터 없음"
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
    description: '구매자가 구매를 확정하면\n판매자에게 정산돼요.',
  },
  {
    icon: 'local_shipping',
    title: '배송 완료 3일 뒤 자동\n구매 확정',
    description: '배송이 끝나고 3일이 지나면 자동으로 구매 확정돼요.',
  },
];

function readFilters(searchParams) {
  return Object.fromEntries(Object.keys(INITIAL_FILTERS).map((key) => [key, searchParams.get(key) ?? '']));
}

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

// 가격 범위: 입력값은 적용된 가격(min·max)으로 시작 (HomePage가 적용 가격을 key로 넘겨서, 초기화되면 새로 만들어짐)
function PriceFilter({ min, max, onApply }) {
  const [priceInput, setPriceInput] = useState({ min, max });
  const [priceError, setPriceError] = useState('');

  const handlePriceChange = (key) => (event) => {
    setPriceInput((prev) => ({ ...prev, [key]: event.target.value.replace(/\D/g, '') }));
  };

  const handleApplyPrice = (event) => {
    event.preventDefault();

    if (priceInput.min !== '' && priceInput.max !== '' && Number(priceInput.min) > Number(priceInput.max)) {
      setPriceError('최소 가격이 최대 가격보다 클 수 없습니다.');
      return;
    }

    setPriceError('');
    onApply(priceInput);
  };

  return (
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
  );
}

// 문구의 \n 위치: 설명 3칸이 가로로 나란히일 때만 줄바꿈 (좁아지면 CSS로 숨기고 띄어쓰기로 이어짐)
function renderLines(text) {
  return text.split('\n').map((line, index) => (
    <span key={line}>
      {index > 0 && ' '}
      {index > 0 && <br className={styles.pointBreak} />}
      {line}
    </span>
  ));
}

function HomePage() {
  // 헤더 검색창에서 넘어온 검색어 (/search?keyword=…), 없으면 ''
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword')?.trim() ?? '';
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  usePageTitle(keyword ? `'${keyword}' 검색 결과` : undefined);

  // URL에는 speciesId만 있으므로 품종 이름은 따로 보관 (새로고침 시에는 품종 상세 API로 다시 가져옴)
  const [speciesInfo, setSpeciesInfo] = useState(null); // { speciesId, name }
  const selectedSpecies =
    filters.speciesId && String(speciesInfo?.speciesId) === filters.speciesId ? speciesInfo : null;

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 정렬을 뺀 조건이 하나라도 있으면 "필터 적용 중"
  const isFiltered = Object.entries(filters).some(([key, value]) => key !== 'sort' && value !== '');
  // 정렬까지 포함해 바꾼 게 있으면 "필터 초기화" 버튼 활성화
  const hasAnyFilter = isFiltered || filters.sort !== '';
  const hasMore = page + 1 < totalPages;
  const categoryLabel = SPECIES_CATEGORIES.find((item) => item.value === filters.category)?.label;

  // 바뀐 필터만 URL에 반영 (빈 값은 URL에서 삭제, 검색어는 그대로 유지)
  // replace: 필터를 누를 때마다 방문 기록이 쌓이지 않도록 (뒤로 가기 한 번에 이전 페이지로)
  const updateFilters = (changes) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => {
          if (value === '') {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        });
        return next;
      },
      { replace: true },
    );
  };

  const updateFilter = (key, value) => updateFilters({ [key]: value });

  // 새로고침·링크로 들어와 speciesId만 있을 때 품종 이름 조회
  useEffect(() => {
    if (!filters.speciesId || String(speciesInfo?.speciesId) === filters.speciesId) return undefined;

    let ignore = false;
    const speciesId = filters.speciesId;

    getSpecies(speciesId)
      .then((response) => {
        if (!ignore) setSpeciesInfo({ speciesId, name: response.data.data.name });
      })
      .catch(() => {
        // 이름을 못 가져와도 필터는 걸려 있으므로 해제할 수 있게 표시
        if (!ignore) setSpeciesInfo({ speciesId, name: '선택한 품종' });
      });

    return () => {
      ignore = true;
    };
  }, [filters.speciesId, speciesInfo]);

  // 검색어나 필터가 바뀔 때마다 첫 페이지부터 다시 조회
  useEffect(() => {
    let ignore = false;

    async function loadFirstPage() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await getProducts({ ...filters, keyword, page: 0, size: PAGE_SIZE });
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
  }, [filters, keyword]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);

    try {
      const response = await getProducts({ ...filters, keyword, page: page + 1, size: PAGE_SIZE });
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
    updateFilters({ category, speciesId: '' });
  };

  const handleSpeciesSelect = (species) => {
    const speciesId = String(species.speciesId);
    setSpeciesInfo({ speciesId, name: species.name });
    updateFilter('speciesId', speciesId);
  };

  const handleSpeciesClear = () => {
    updateFilter('speciesId', '');
  };

  const handleApplyPrice = ({ min, max }) => {
    updateFilters({ minPrice: min, maxPrice: max });
  };

  const handleReset = () => {
    updateFilters(INITIAL_FILTERS);
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

    if (products.length === 0 && keyword) {
      return (
        <div className={styles.empty}>
          <span className={`material-symbols-outlined ${styles.emptyIcon}`}>potted_plant</span>
          <h3 className={styles.emptyTitle}>‘{keyword}’에 맞는 식물이 없어요</h3>
          <p className={styles.emptyDesc}>
            {isFiltered ? '검색어를 바꾸거나 필터를 초기화해 보세요.' : '다른 검색어로 검색해 보세요.'}
          </p>
          {isFiltered && (
            <button type="button" className={styles.outlineButton} onClick={handleReset}>
              <span className="material-symbols-outlined">restart_alt</span>
              필터 초기화
            </button>
          )}
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
      {/* ① 배너 (검색 결과 화면에서는 숨김) */}
      {!keyword && (
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroText}>
            <h1 id="hero-title" className={styles.heroTitle}>
              반려식물을 택배로
              <br />
              사고팔아요
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
                  <strong>{renderLines(point.title)}</strong>
                  <p>{renderLines(point.description)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

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
          <PriceFilter
            key={`${filters.minPrice}~${filters.maxPrice}`}
            min={filters.minPrice}
            max={filters.maxPrice}
            onApply={handleApplyPrice}
          />

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

          <div className={styles.filterActions}>
            <label className={styles.onSaleToggle}>
              <input
                type="checkbox"
                checked={filters.onSale === 'true'}
                onChange={(event) => updateFilter('onSale', event.target.checked ? 'true' : '')}
              />
              판매 중만
            </label>

            {/* 필터·정렬을 한 번에 초기화 (검색어는 유지) */}
            <button type="button" className={styles.outlineButton} onClick={handleReset} disabled={!hasAnyFilter}>
              <span className="material-symbols-outlined">restart_alt</span>
              필터 초기화
            </button>
          </div>
        </div>
      </section>

      {/* ③ 상품 목록 */}
      <section className={styles.list} aria-labelledby="list-title">
        <div className={styles.listHeader}>
          <h2 id="list-title" className={styles.listTitle}>
            {keyword
              ? `‘${keyword}’ 검색 결과`
              : (selectedSpecies?.name ?? (filters.category ? categoryLabel : '새로 올라온 식물'))}
          </h2>
          {!isLoading && <span className={styles.listMeta}>{totalElements}개</span>}
        </div>
        {renderList()}
      </section>
    </div>
  );
}

export default HomePage;
