import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import SpeciesFilter from '../components/product/SpeciesFilter';
import { ActionErrorBar, ActionErrorLine } from '../components/common/ActionError';
import { SPECIES_CATEGORIES, SPECIES_DIFFICULTY, SPECIES_LIGHT, SPECIES_WATERING } from '../constants/product';
import bannerImage from '../assets/main-banner.jpg';

// 메인 · 상품 목록 화면 (시안 02-1-1 메인, 02-1-2 검색 결과 없음)
// 데이터와 동작은 HomePage가 props로 넘김

const FOREST = { backgroundColor: 'rgb(15, 76, 58)' };
const GLASS = { backgroundColor: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(12px)' };
// 전역 규칙(모든 요소 모서리 0px !important)을 이기려고 시안처럼 인라인 4px !important를 줌 (CountBadge와 같은 방식)
const radius4 = (el) => el?.style.setProperty('border-radius', '4px', 'important');

const BENEFITS = [
  {
    title: '예치금 안전결제',
    description: '토스페이먼츠로 충전한 예치금으로 결제하고, 결제 금액은 플랫폼이 안전하게 보관해요.',
    icon: (
      <>
        <rect height="14" rx="2" width="18" x="3" y="5" />
        <path d="M16 12h.01M3 9h18" />
      </>
    ),
  },
  {
    title: '구매 확정 후 정산',
    description: '주문한 상품이 모두 구매 확정되면 수수료 5%를 뺀 금액이 판매자 예치금으로 정산돼요.',
    icon: (
      <>
        <rect height="12" rx="2" width="20" x="2" y="6" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </>
    ),
  },
  {
    title: '배송 완료 3일 뒤 자동 확정',
    description: '배송 완료 후 3일이 지나면 판매자 보호를 위해 자동으로 구매 확정 및 정산돼요.',
    icon: (
      <>
        <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
        <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </>
    ),
  },
];

const CARE_FILTERS = [
  { key: 'light', label: '광량', options: SPECIES_LIGHT },
  { key: 'watering', label: '물주기', options: SPECIES_WATERING },
  { key: 'difficulty', label: '난이도', options: SPECIES_DIFFICULTY },
];

function SafeTransactionBanner() {
  return (
    <section
      className="w-full bg-[#133e2c] text-white p-8 lg:p-12 mb-10 shadow-sm relative overflow-hidden"
      data-purpose="safe-pay-banner"
      style={FOREST}
    >
      <div className="absolute inset-0 pointer-events-none z-0">
        <img alt="lush modern indoor botanical plants background" className="w-full h-full object-cover" src={bannerImage} />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(15, 76, 58, 0.75) 0%, rgba(15, 76, 58, 0.5) 50%, rgba(15, 76, 58, 0.7) 100%)',
          }}
        />
      </div>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-10 relative z-10">
        <div className="max-w-[340px] shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium mb-3.5 tracking-tight w-fit text-white">
            <span>🌱</span> 식물 애호가를 위한 안전거래
          </div>
          <h1
            className="font-bold text-[36px] leading-[1.28] tracking-tight text-white"
            style={{ textShadow: 'rgba(0, 0, 0, 0.45) 0px 2px 8px' }}
          >
            반려식물을 택배로
            <br />
            사고팔아요
          </h1>
          <p
            className="text-[15px] font-normal leading-relaxed text-white/80 mt-3 tracking-normal"
            style={{ textShadow: 'rgba(0, 0, 0, 0.4) 0px 1px 4px' }}
          >
            모든 거래는 택배로, 결제는 예치금으로만 이뤄져요.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="p-6 flex flex-col justify-between min-h-[175px] transition-all duration-200 border border-white/20 hover:border-white/35"
              style={GLASS}
              ref={radius4}
            >
              <div>
                <div
                  className="w-9 h-9 border border-white/30 flex items-center justify-center mb-4 text-[#b7dfca]"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                  ref={radius4}
                >
                  <svg className="w-5 h-5 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
                    {benefit.icon}
                  </svg>
                </div>
                <h3 className="font-bold text-[16px] mb-2 text-white leading-snug tracking-tight">{benefit.title}</h3>
                <p className="text-[13px] leading-relaxed text-white">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 가격 범위: 입력값은 적용된 가격(min·max)으로 시작 (적용 가격이 바뀌면 key로 새로 만들어짐)
function PriceFilter({ min, max, onApply }) {
  const [priceInput, setPriceInput] = useState({ min, max });
  const [priceError, setPriceError] = useState('');

  const handleChange = (key) => (event) => {
    setPriceInput((prev) => ({ ...prev, [key]: event.target.value.replace(/\D/g, '') }));
  };

  const handleApply = () => {
    if (priceInput.min !== '' && priceInput.max !== '' && Number(priceInput.min) > Number(priceInput.max)) {
      setPriceError('최소 가격이 최대 가격보다 클 수 없어요.');
      return;
    }
    setPriceError('');
    onApply(priceInput);
  };

  const renderInput = (key, placeholder) => (
    <div className="relative flex-1">
      <input
        className="form-input w-full text-xs h-8 pl-2.5 pr-6 bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-replant-forest focus:border-replant-forest"
        placeholder={placeholder}
        type="text"
        inputMode="numeric"
        aria-label={`${placeholder} 가격`}
        value={priceInput[key]}
        onChange={handleChange(key)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') handleApply();
        }}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">원</span>
    </div>
  );

  return (
    <div className="pt-2 border-t border-gray-100">
      <h3 className="text-[13px] font-bold text-gray-900 mb-2.5">가격</h3>
      <div className="flex items-center gap-1.5">
        {renderInput('min', '최소')}
        <span className="text-gray-400 text-xs">~</span>
        {renderInput('max', '최대')}
      </div>
      <button
        className="w-full h-8 mt-2 text-xs font-semibold bg-[#1b4332] hover:bg-[#133e2c] text-white rounded-md transition-colors"
        type="button"
        style={FOREST}
        onClick={handleApply}
      >
        가격 적용
      </button>
      <ActionErrorLine message={priceError} />
    </div>
  );
}

function SidebarFilter({ filters, sorts, selectedSort, selectedSpecies, handlers }) {
  return (
    <aside
      className="w-full lg:w-[270px] shrink-0 bg-white border p-5 shadow-xs sticky top-[100px] border-gray-200"
      data-purpose="sidebar-filter"
    >
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2 className="text-[16px] font-bold text-gray-900">필터</h2>
        </div>
        {/* 필터 · 정렬을 한 번에 초기화 (검색어는 유지) */}
        <button
          className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
          type="button"
          onClick={handlers.onReset}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>초기화</span>
        </button>
      </div>

      <div className="py-4 border-b border-gray-100">
        <h3 className="text-[13px] font-bold text-gray-900 mb-2.5">카테고리</h3>
        <div className="flex flex-wrap gap-1.5">
          {SPECIES_CATEGORIES.map((item) =>
            filters.category === item.value ? (
              <button
                key={item.value || 'all'}
                className="px-3 py-1.5 bg-[#1b4332] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                type="button"
                style={FOREST}
                aria-pressed="true"
                onClick={() => handlers.onCategoryChange(item.value)}
              >
                <span>✓</span>
                <span>{item.label}</span>
              </button>
            ) : (
              <button
                key={item.value || 'all'}
                className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                type="button"
                aria-pressed="false"
                onClick={() => handlers.onCategoryChange(item.value)}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="py-4 border-b border-gray-100">
        <h3 className="text-[13px] font-bold text-gray-900 mb-2">품종 검색</h3>
        <SpeciesFilter
          category={filters.category}
          selected={selectedSpecies}
          onSelect={handlers.onSpeciesSelect}
          onClear={handlers.onSpeciesClear}
        />
      </div>

      <div className="py-4 border-b border-gray-100 space-y-3.5">
        <h3 className="text-[13px] font-bold text-gray-900">관리 조건</h3>
        {CARE_FILTERS.map((care) => (
          <div key={care.key}>
            <span className="block text-[11px] font-semibold text-gray-500 mb-1.5">{care.label}</span>
            <div className="flex flex-wrap gap-1.5">
              {[['', '전체'], ...Object.entries(care.options)].map(([value, label]) =>
                filters[care.key] === value ? (
                  <button
                    key={value || 'all'}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-[#1b4332] text-white rounded-md"
                    type="button"
                    style={FOREST}
                    aria-pressed="true"
                    onClick={() => handlers.onFilterChange(care.key, value)}
                  >
                    {label}
                  </button>
                ) : (
                  <button
                    key={value || 'all'}
                    className="px-2.5 py-1 text-[11px] font-normal bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-md"
                    type="button"
                    aria-pressed="false"
                    onClick={() => handlers.onFilterChange(care.key, value)}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 space-y-3">
        <h3 className="text-[13px] font-bold text-gray-900">정렬 기준</h3>
        <div
          className={`grid ${sorts.length === 4 ? 'grid-cols-4' : 'grid-cols-3'} gap-1 p-0.5 bg-gray-100 rounded-md text-xs`}
        >
          {sorts.map((item) =>
            selectedSort === item.value ? (
              <button
                key={item.label}
                className="py-1.5 text-center bg-[#1b4332] text-white rounded font-semibold transition-colors"
                type="button"
                style={FOREST}
                aria-pressed="true"
                onClick={() => handlers.onFilterChange('sort', item.value)}
              >
                {item.label}
              </button>
            ) : (
              <button
                key={item.label}
                className="py-1.5 text-center bg-white text-gray-600 border border-gray-200 hover:text-gray-900 rounded font-medium transition-colors"
                type="button"
                aria-pressed="false"
                onClick={() => handlers.onFilterChange('sort', item.value)}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
        <PriceFilter
          key={`${filters.minPrice}~${filters.maxPrice}`}
          min={filters.minPrice}
          max={filters.maxPrice}
          onApply={handlers.onApplyPrice}
        />
        <div className="pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              className="form-checkbox w-4 h-4 rounded text-replant-forest border-gray-300 focus:ring-replant-forest"
              type="checkbox"
              checked={filters.onSale === 'true'}
              onChange={(event) => handlers.onFilterChange('onSale', event.target.checked ? 'true' : '')}
            />
            <span className="text-xs font-medium text-gray-700 font-bold">판매 중만 보기</span>
          </label>
        </div>
      </div>
    </aside>
  );
}

// 목록이 비었을 때 (02-1-2 검색 결과 없음 상자. 검색어 없이 필터만 건 경우는 시안이 없어 같은 상자에 문구만 바꿈)
function EmptyBox({ keyword, isFiltered, onReset }) {
  const text = keyword
    ? { title: '검색 결과가 없어요', description: '다른 이름이나 품종으로 검색해 보세요.' }
    : isFiltered
      ? { title: '조건에 맞는 식물이 없어요', description: '필터를 바꾸거나 초기화해 보세요.' }
      : { title: '아직 올라온 식물이 없어요', description: '새 식물이 올라오면 여기에 보여 드려요.' };
  const buttonClass =
    'mt-3 h-12 px-6 bg-[#0f4c3a] hover:bg-[#083226] text-white text-[16px] font-bold flex items-center justify-center transition-colors';

  return (
    <div
      className="bg-white border border-[#e5e7eb] py-20 px-6 flex flex-col items-center text-center gap-3"
      data-purpose="search-empty"
    >
      <div className="w-16 h-16 bg-[#f4f8f6] border border-[#d1e7dd] flex items-center justify-center">
        <svg className="w-8 h-8 text-[#0f4c3a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" x2="16.65" y1="21" y2="16.65" />
        </svg>
      </div>
      <h2 className="mt-2 text-xl font-bold text-[#111827]">{text.title}</h2>
      <p className="text-[15px] text-[#4b5563]">{text.description}</p>
      {keyword ? (
        <Link to="/" className={buttonClass}>
          식물 둘러보기
        </Link>
      ) : (
        isFiltered && (
          <button type="button" className={buttonClass} onClick={onReset}>
            필터 초기화
          </button>
        )
      )}
    </div>
  );
}

function ProductList({ keyword, isFiltered, products, isLoading, errorMessage, hasMore, isLoadingMore, handlers }) {
  if (isLoading) {
    return <p className="py-20 text-center text-sm text-gray-400">상품을 불러오는 중...</p>;
  }
  if (errorMessage && products.length === 0) {
    return <ActionErrorBar message={errorMessage} />;
  }
  if (products.length === 0) {
    return <EmptyBox keyword={keyword} isFiltered={isFiltered} onReset={handlers.onReset} />;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7">
        {products.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 shadow-xs transition-all active:scale-95"
            onClick={handlers.onLoadMore}
            disabled={isLoadingMore}
          >
            <span>{isLoadingMore ? '불러오는 중...' : '더 불러오기'}</span>
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
      {errorMessage && <ActionErrorLine message={errorMessage} className="mt-3 text-center" />}
    </>
  );
}

// listTitle: 검색어가 없을 때 목록 제목 (새로 올라온 식물 · 카테고리 · 품종 이름)
function HomeView({
  keyword,
  listTitle,
  filters,
  sorts,
  selectedSort,
  selectedSpecies,
  isFiltered,
  products,
  totalElements,
  isLoading,
  errorMessage,
  hasMore,
  isLoadingMore,
  handlers,
}) {
  return (
    <main className="max-w-[1240px] mx-auto px-5 w-full flex-grow pt-8 pb-16">
      <SafeTransactionBanner />
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <SidebarFilter
          filters={filters}
          sorts={sorts}
          selectedSort={selectedSort}
          selectedSpecies={selectedSpecies}
          handlers={handlers}
        />
        <div className="flex-1 w-full min-w-0" data-purpose="product-listing-main">
          <div className="flex items-center justify-between border-b border-gray-200/80 pb-3 mb-6">
            {keyword ? (
              <div className="flex items-baseline gap-2">
                <h2 className="text-[20px] font-semibold leading-[1.35] tracking-[-0.015em] text-[#191919]">
                  <span className="text-[#0f4c3a]">{keyword}</span> 검색 결과
                </h2>
                {!isLoading && <span className="text-sm font-normal text-gray-400 tabular-nums">{`${totalElements}개`}</span>}
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <h2 className="text-[20px] font-semibold leading-[1.35] tracking-[-0.015em] text-[#191919]">{listTitle}</h2>
                {!isLoading && <span className="text-sm font-normal text-gray-400">{`${totalElements}개`}</span>}
              </div>
            )}
          </div>
          <ProductList
            keyword={keyword}
            isFiltered={isFiltered}
            products={products}
            isLoading={isLoading}
            errorMessage={errorMessage}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            handlers={handlers}
          />
        </div>
      </div>
    </main>
  );
}

export default HomeView;
