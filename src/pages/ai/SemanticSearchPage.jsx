import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import { searchSpeciesBySentence } from '../../api/aiApi';
import { getProduct } from '../../api/productApi';
import {
  SENTENCE_QUERY_MAX,
  SENTENCE_QUERY_MIN,
  getSentenceSearchErrorMessage,
} from '../../constants/ai';
import SemanticSearchView from './SemanticSearchView';

// 문장으로 찾기 (품종 의미 검색, BE GET speciesSearches)
// 검색 문장은 URL(?query=)에 두어 새로고침 · 뒤로 가기 · 링크 공유에도 유지

// 상품 상세 응답 → 목록 카드(ProductCard) 모양
function toCardProduct(detail) {
  return {
    productId: detail.productId,
    title: detail.title,
    price: detail.price,
    thumbnailUrl: detail.imageUrls?.[0] ?? null,
    status: detail.status,
    createdAt: detail.createdAt,
  };
}

// 품종별 상품 ID를 상품 상세 API로 채움. 그 사이 숨김 · 삭제돼 조회에 실패한 상품은 뺌
async function loadProducts(items) {
  const productIds = [...new Set(items.flatMap((item) => item.productIds ?? []))];
  const results = await Promise.allSettled(productIds.map((productId) => getProduct(productId)));
  const products = {};
  results.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    const detail = result.value.data.data;
    if (detail.hidden) return;
    products[detail.productId] = toCardProduct(detail);
  });
  return products;
}

function SemanticSearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query')?.trim() ?? '';
  const isValidQuery = query.length >= SENTENCE_QUERY_MIN && query.length <= SENTENCE_QUERY_MAX;

  usePageTitle(query ? `'${query}' 문장으로 찾기` : '문장으로 찾기');

  // result: 검색한 문장(query)과 그 결과. query와 다르면 아직 이 문장의 결과가 아님 (= 검색 중)
  const [result, setResult] = useState({ query: '', items: [], errorMessage: '' });
  // products: { [productId]: 카드 상품 } · productsQuery: 어떤 문장의 상품인지
  const [products, setProducts] = useState({});
  const [productsQuery, setProductsQuery] = useState('');

  useEffect(() => {
    if (!isValidQuery) return undefined;

    let ignore = false;

    async function search() {
      try {
        const response = await searchSpeciesBySentence(query);
        if (ignore) return;
        const items = response.data.data?.items ?? [];
        setResult({ query, items, errorMessage: '' });

        const loaded = await loadProducts(items);
        if (ignore) return;
        setProducts(loaded);
        setProductsQuery(query);
      } catch (error) {
        if (!ignore)
          setResult({ query, items: [], errorMessage: getSentenceSearchErrorMessage(error) });
      }
    }

    search();

    return () => {
      ignore = true;
    };
  }, [query, isValidQuery]);

  const isSearching = isValidQuery && result.query !== query;
  const isLoadingProducts = !isSearching && productsQuery !== query;

  const handleSearch = (sentence) => {
    navigate(`/search/semantic?query=${encodeURIComponent(sentence)}`);
  };

  return (
    <SemanticSearchView
      key={query}
      query={query}
      isValidQuery={isValidQuery}
      isSearching={isSearching}
      items={isSearching ? [] : result.items}
      errorMessage={isSearching ? '' : result.errorMessage}
      products={isLoadingProducts ? {} : products}
      isLoadingProducts={isLoadingProducts}
      onSearch={handleSearch}
    />
  );
}

export default SemanticSearchPage;
