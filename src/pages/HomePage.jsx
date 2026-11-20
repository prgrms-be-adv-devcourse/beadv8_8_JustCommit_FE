import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { getProducts, getSpecies } from '../api/productApi';
import { SPECIES_CATEGORIES } from '../constants/product';
import HomeView from './HomeView';

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

// 정렬 (BE ProductSearchRequest.sort). value ''은 BE 기본값
// 검색어 없음: 최신순(기본) · 낮은 가격 · 높은 가격 3칸 (시안 02-1-1)
// 검색어 있음: BE 기본이 관련도순(OpenSearch)이라 관련도순(기본) · 최신순 · 낮은 가격 · 높은 가격 4칸
const SORTS = [
  { value: '', label: '최신순' },
  { value: 'priceAsc', label: '낮은 가격' },
  { value: 'priceDesc', label: '높은 가격' },
];
const SEARCH_SORTS = [
  { value: '', label: '관련도순' },
  { value: 'latest', label: '최신순' },
  { value: 'priceAsc', label: '낮은 가격' },
  { value: 'priceDesc', label: '높은 가격' },
];

function readFilters(searchParams) {
  return Object.fromEntries(Object.keys(INITIAL_FILTERS).map((key) => [key, searchParams.get(key) ?? '']));
}

function getErrorMessage(error) {
  return error.response?.data?.message ?? '상품 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
}

function HomePage() {
  // 헤더 검색창에서 넘어온 검색어 (/search?keyword=…), 없으면 ''
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword')?.trim() ?? '';
  const filters = readFilters(searchParams);
  // 목록 조회 조건 (검색어 + 필터 + API 정렬). 문자열로 만들어 바뀔 때만 다시 조회
  const query = JSON.stringify({ ...filters, keyword });

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
  const hasMore = page + 1 < totalPages;
  const categoryLabel = SPECIES_CATEGORIES.find((item) => item.value === filters.category)?.label;
  const listTitle = selectedSpecies?.name ?? (filters.category ? categoryLabel : '새로 올라온 식물');

  const sorts = keyword ? SEARCH_SORTS : SORTS;
  // 검색 중 고른 최신순(latest)은 검색어를 지워도 남으므로, 검색어가 없으면 기본(최신순) 칸으로 보여 줌
  const selectedSort = !keyword && filters.sort === 'latest' ? '' : filters.sort;

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
        const response = await getProducts({ ...JSON.parse(query), page: 0, size: PAGE_SIZE });
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
  }, [query]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setErrorMessage('');

    try {
      const response = await getProducts({ ...JSON.parse(query), page: page + 1, size: PAGE_SIZE });
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

  const handlers = {
    // 카테고리를 바꾸면 선택한 품종은 해제 (품종은 카테고리에 속하므로 결과가 0개가 되는 것을 방지)
    onCategoryChange: (category) => updateFilters({ category, speciesId: '' }),
    onFilterChange: (key, value) => updateFilters({ [key]: value }),
    onSpeciesSelect: (species) => {
      const speciesId = String(species.speciesId);
      setSpeciesInfo({ speciesId, name: species.name });
      updateFilters({ speciesId });
    },
    onSpeciesClear: () => updateFilters({ speciesId: '' }),
    onApplyPrice: ({ min, max }) => updateFilters({ minPrice: min, maxPrice: max }),
    onReset: () => updateFilters(INITIAL_FILTERS),
    onLoadMore: handleLoadMore,
  };

  return (
    <HomeView
      keyword={keyword}
      listTitle={listTitle}
      filters={filters}
      sorts={sorts}
      selectedSort={selectedSort}
      selectedSpecies={selectedSpecies}
      isFiltered={isFiltered}
      products={products}
      totalElements={totalElements}
      isLoading={isLoading}
      errorMessage={errorMessage}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      handlers={handlers}
    />
  );
}

export default HomePage;
