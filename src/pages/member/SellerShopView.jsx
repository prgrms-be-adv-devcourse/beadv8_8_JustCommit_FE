import { ActionErrorLine } from '../../components/common/ActionError';
import ProductCard from '../../components/product/ProductCard';
import PageBackLink from '../../components/common/PageBackLink';
import SellerShopBar from '../../components/seller/SellerShopBar';

// 판매자 상점 B안 · 상품 중심 (시안 02-3-1, 판매 중 상품 없음 02-3-2, 02-3-4)
// 리뷰는 판매자 줄의 별점 · 리뷰 수 · 「리뷰 전체 보기」 링크만 (「최근 리뷰」 칸은 그리지 않음)
// seller = SellerShopBar의 seller
// products = [ ProductCard의 product ], productCountText = "8개"
// backTo = 「< 상품 상세」 이동할 곳
// sold = 판매 완료 줄 (null이면 줄을 통째로 숨김 = 판매 완료 0개, 시안에 없는 상태)
//   { products: [ ProductCard의 product(status SOLD_OUT) ], countText: "41개", hasMore, isLoadingMore, onLoadMore, errorMessage }
// introEditTo = 내 상점일 때 소개글 수정 화면 주소 (남의 상점이면 null)
// reviewsTo · reviewsState = 「리뷰 전체 보기」 이동할 곳 · router state
function SellerShopView({ seller, products, productCountText, sold, backTo, introEditTo, reviewsTo, reviewsState }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="space-y-6">
        <PageBackLink to={backTo} label="상품 상세" />
        <SellerShopBar seller={seller} introEditTo={introEditTo} reviewsTo={reviewsTo} reviewsState={reviewsState} />
        <div className="flex flex-wrap items-start gap-6">
          <section aria-labelledby="b-sale" className="flex-[999_1_640px] min-w-0 space-y-4">
            <h2 id="b-sale" className="text-xl font-bold text-[#111827]">
              {'판매 중 '}
              <span className="text-[15px] font-medium text-[#6b7280] tabular-nums">{productCountText}</span>
            </h2>
            {products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-7">
                {products.map((product) => (
                  <ProductCard key={product.productId} product={product} tabularPrice />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#e5e7eb] px-6 py-20 flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 bg-[#f4f8f6] border border-[#d1e7dd] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#0f4c3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14zm0 0l7-7"
                    />
                  </svg>
                </div>
                <h3 className="mt-2 text-xl font-bold text-[#111827]">지금 판매 중인 식물이 없어요</h3>
                <p className="text-[15px] text-[#4b5563]">
                  {/* 판매 완료 줄이 있으면 그쪽으로 안내 (판매 완료도 없으면 옛 문구, 시안에 없는 상태) */}
                  {sold ? '아래에서 이 판매자가 판 식물을 볼 수 있어요.' : '다른 판매자의 식물도 둘러보세요.'}
                </p>
              </div>
            )}
            {sold && (
              <div className="pt-6 space-y-4">
                <h2 id="b-sold" className="text-xl font-bold text-[#111827]">
                  {'판매 완료 '}
                  <span className="text-[15px] font-medium text-[#6b7280] tabular-nums">{sold.countText}</span>
                </h2>
                {sold.products.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-7">
                    {sold.products.map((product) => (
                      <ProductCard key={product.productId} product={product} tabularPrice showTime={false} />
                    ))}
                  </div>
                )}
                {sold.hasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 shadow-xs transition-all active:scale-95"
                      onClick={sold.onLoadMore}
                      disabled={sold.isLoadingMore}
                    >
                      <span>{sold.isLoadingMore ? '불러오는 중...' : '더 불러오기'}</span>
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                )}
                {sold.errorMessage && <ActionErrorLine message={sold.errorMessage} className="mt-3 text-center" />}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default SellerShopView;
