import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import { ActionErrorBar, ActionErrorLine } from '../../components/common/ActionError';
import { SENTENCE_EXAMPLES, SENTENCE_QUERY_MAX, SENTENCE_QUERY_MIN } from '../../constants/ai';

// 문장으로 찾기 화면. 데이터와 동작은 SemanticSearchPage가 props로 넘김
// (웹 시안에 없는 화면이라 메인 목록 · 검색 결과 없음 상자의 모양을 따름)

const FOREST = '#0f4c3a';

function SentenceForm({ query, onSearch }) {
  const [sentence, setSentence] = useState(query);
  const [inputError, setInputError] = useState('');

  const submit = (value) => {
    const trimmed = value.trim();
    if (trimmed.length < SENTENCE_QUERY_MIN) {
      setInputError(`${SENTENCE_QUERY_MIN}자 이상 입력해 주세요.`);
      return;
    }
    setInputError('');
    onSearch(trimmed);
  };

  return (
    <section className="border border-[#e5e7eb] bg-[#f8faf9] p-6 mb-8">
      <h1 className="text-[22px] font-bold text-[#111827]">문장으로 식물 찾기</h1>
      <p className="mt-1 text-[14px] text-[#4b5563]">
        이름을 몰라도 괜찮아요. 키우는 환경이나 원하는 모습을 문장으로 적으면 비슷한 품종과 판매
        중인 식물을 찾아 드려요.
      </p>
      <form
        role="search"
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit(sentence);
        }}
      >
        <div className="relative flex-1">
          <input
            type="text"
            className="w-full h-12 pl-4 pr-20 border border-[#d1d5db] bg-white text-[15px] text-[#111827] placeholder-gray-400 focus:outline-none focus:border-[#0f4c3a] focus:ring-0"
            placeholder="예: 햇빛 적은 방에서 키우기 쉬운 식물"
            aria-label="찾고 싶은 식물을 문장으로 입력"
            maxLength={SENTENCE_QUERY_MAX}
            enterKeyHint="search"
            value={sentence}
            onChange={(event) => setSentence(event.target.value)}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 tabular-nums">
            {`${sentence.length}/${SENTENCE_QUERY_MAX}`}
          </span>
        </div>
        <button
          type="submit"
          className="h-12 px-6 text-white text-[15px] font-bold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: FOREST }}
        >
          찾기
        </button>
      </form>
      <ActionErrorLine message={inputError} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">이렇게 찾아 보세요</span>
        {SENTENCE_EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            className="h-8 px-3 border border-[#d1e7dd] bg-white text-[13px] text-[#0f4c3a] hover:bg-[#f0f5f1] transition-colors"
            onClick={() => {
              setSentence(example);
              submit(example);
            }}
          >
            {example}
          </button>
        ))}
      </div>
    </section>
  );
}

function SimilarityBar({ similarity }) {
  const percent = Math.round(Math.max(0, Math.min(1, similarity ?? 0)) * 100);
  return (
    <div
      className="flex items-center gap-2"
      title="문장과 품종 설명이 얼마나 비슷한지 (1에 가까울수록 비슷)"
    >
      <span className="text-xs text-gray-500">유사도</span>
      <div className="w-24 h-1.5 bg-[#e5e7eb]">
        <div className="h-full" style={{ width: `${percent}%`, backgroundColor: FOREST }} />
      </div>
      <span className="text-xs font-semibold text-[#0f4c3a] tabular-nums">
        {(similarity ?? 0).toFixed(2)}
      </span>
    </div>
  );
}

function SpeciesResultCard({ rank, item, products, isLoadingProducts }) {
  const productIds = item.productIds ?? [];
  const cards = productIds.map((productId) => products[productId]).filter(Boolean);

  let productArea;
  if (productIds.length === 0) {
    productArea = (
      <p className="py-6 text-center text-sm text-gray-400">지금 판매 중인 상품이 없어요.</p>
    );
  } else if (isLoadingProducts) {
    productArea = <p className="py-6 text-center text-sm text-gray-400">상품을 불러오는 중...</p>;
  } else if (cards.length === 0) {
    productArea = (
      <p className="py-6 text-center text-sm text-gray-400">상품 정보를 불러오지 못했어요.</p>
    );
  } else {
    productArea = (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
        {cards.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>
    );
  }

  return (
    <article className="border border-[#e5e7eb] bg-white p-5" data-purpose="species-result">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span
            className="w-7 h-7 flex items-center justify-center text-[13px] font-bold text-white"
            style={{ backgroundColor: FOREST }}
          >
            {rank}
          </span>
          <h2 className="text-[18px] font-bold text-[#111827]">{item.name}</h2>
          <SimilarityBar similarity={item.similarity} />
        </div>
        <Link
          to={`/?speciesId=${item.speciesId}`}
          className="text-[13px] font-semibold text-[#0f4c3a] hover:underline underline-offset-4"
        >
          {`${item.name} 상품 모두 보기 ›`}
        </Link>
      </div>
      {productArea}
    </article>
  );
}

function EmptyResult() {
  return (
    <div className="bg-white border border-[#e5e7eb] py-16 px-6 flex flex-col items-center text-center gap-3">
      <h2 className="text-xl font-bold text-[#111827]">비슷한 식물을 찾지 못했어요</h2>
      <p className="text-[15px] text-[#4b5563]">
        키우는 환경이나 원하는 모습을 조금 더 자세히 적어 보세요.
      </p>
      <Link
        to="/"
        className="mt-3 h-12 px-6 text-white text-[16px] font-bold flex items-center justify-center"
        style={{ backgroundColor: FOREST }}
      >
        식물 둘러보기
      </Link>
    </div>
  );
}

function SemanticSearchView({
  query,
  isValidQuery,
  isSearching,
  items,
  errorMessage,
  products,
  isLoadingProducts,
  onSearch,
}) {
  let body = null;
  if (query && !isValidQuery) {
    body = (
      <ActionErrorBar
        message={`문장은 ${SENTENCE_QUERY_MIN} ~ ${SENTENCE_QUERY_MAX}자로 입력해 주세요.`}
      />
    );
  } else if (isSearching) {
    body = <p className="py-20 text-center text-sm text-gray-400">비슷한 식물을 찾는 중...</p>;
  } else if (errorMessage) {
    body = <ActionErrorBar message={errorMessage} />;
  } else if (query && items.length === 0) {
    body = <EmptyResult />;
  } else if (items.length > 0) {
    body = (
      <>
        <div className="flex items-baseline gap-2 border-b border-gray-200/80 pb-3 mb-6">
          <h2 className="text-[20px] font-semibold leading-[1.35] tracking-[-0.015em] text-[#191919]">
            <span className="text-[#0f4c3a]">{`'${query}'`}</span>와 비슷한 품종
          </h2>
          <span className="text-sm text-gray-400 tabular-nums">{`${items.length}개`}</span>
        </div>
        <div className="flex flex-col gap-5">
          {items.map((item, index) => (
            <SpeciesResultCard
              key={item.speciesId}
              rank={index + 1}
              item={item}
              products={products}
              isLoadingProducts={isLoadingProducts}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <main className="max-w-[1240px] mx-auto px-5 w-full flex-grow pt-8 pb-16">
      <SentenceForm query={query} onSearch={onSearch} />
      {body}
    </main>
  );
}

export default SemanticSearchView;
