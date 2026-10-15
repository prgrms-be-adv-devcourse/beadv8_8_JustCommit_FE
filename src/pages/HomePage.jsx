import { useEffect, useState } from 'react';
import ProductCard from '../components/product/ProductCard';
import usePageTitle from '../hooks/usePageTitle';
import { getProducts } from '../api/productApi';
import { PRODUCT_SORTS, SPECIES_CATEGORIES } from '../constants/product';
import styles from './HomePage.module.css';

const PAGE_SIZE = 20;

const INITIAL_FILTERS = {
  category: '',
  sort: '',
  minPrice: '',
  maxPrice: '',
};

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

function HomePage() {
  usePageTitle();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [priceInput, setPriceInput] = useState({ min: '', max: '' });
  const [priceError, setPriceError] = useState('');

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isFiltered = filters.category !== '' || filters.minPrice !== '' || filters.maxPrice !== '';
  const hasMore = page + 1 < totalPages;
  const categoryLabel = SPECIES_CATEGORIES.find((item) => item.value === filters.category)?.label;

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
            분류
          </span>
          <div className={styles.chips} role="group" aria-labelledby="category-label">
            {SPECIES_CATEGORIES.map((item) => {
              const isSelected = filters.category === item.value;
              return (
                <button
                  key={item.value || 'all'}
                  type="button"
                  aria-pressed={isSelected}
                  className={`${styles.chip} ${isSelected ? styles.chipSelected : ''}`}
                  onClick={() => setFilters((prev) => ({ ...prev, category: item.value }))}
                >
                  {isSelected && <span className="material-symbols-outlined">check</span>}
                  {item.label}
                </button>
              );
            })}
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
                  onClick={() => setFilters((prev) => ({ ...prev, sort: item.value }))}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ③ 상품 목록 */}
      <section className={styles.list} aria-labelledby="list-title">
        <div className={styles.listHeader}>
          <h2 id="list-title" className={styles.listTitle}>
            {filters.category ? categoryLabel : '새로 올라온 식물'}
          </h2>
          {!isLoading && <span className={styles.listMeta}>{totalElements}개</span>}
        </div>
        {renderList()}
      </section>
    </div>
  );
}

export default HomePage;
