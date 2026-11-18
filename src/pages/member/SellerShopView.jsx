import { Link } from 'react-router-dom';
import { ActionErrorLine } from '../../components/common/ActionError';
import ProductCard from '../../components/product/ProductCard';
import Stars, { StarIcon } from '../../components/review/Stars';
import PageBackLink from '../../components/common/PageBackLink';
import SellerShopBar from '../../components/seller/SellerShopBar';

// 판매자 상점 B안 · 상품 중심 (시안 02-4-4, 판매 중 상품 없음 02-4-5, 리뷰 없음 02-4-7)
// seller = SellerShopBar의 seller (noReviews면 「최근 리뷰」에 빈 상태 문구, 「리뷰 전체 보기」 없음)
// products = [ ProductCard의 product ], productCountText = "8개"
// reviews = [{ key, nickname(null = 탈퇴한 회원), rating, dateText, productText, content }]
// backTo = 「< 상품 상세」 이동할 곳, reviewsTo = 「리뷰 전체 보기」 이동할 곳
// sold = 판매 완료 줄 (null이면 줄을 통째로 숨김 = 판매 완료 0개, 시안에 없는 상태)
//   { products: [ ProductCard의 product(status SOLD_OUT) ], countText: "41개", hasMore, isLoadingMore, onLoadMore, errorMessage }
function SellerShopView({ seller, products, productCountText, sold, reviews, backTo, reviewsTo, reviewsState }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="space-y-6">
        <PageBackLink to={backTo} label="상품 상세" />
        <SellerShopBar seller={seller} />
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
                  {sold ? '아래에서 이 판매자가 판 식물을 볼 수 있어요.' : '오른쪽에서 이 판매자의 리뷰를 확인해 보세요.'}
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
                      <ProductCard key={product.productId} product={product} tabularPrice />
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
          <aside
            aria-labelledby="b-reviews"
            className="flex-[1_1_300px] max-w-[360px] bg-white border border-[#e5e7eb] p-5 flex flex-col gap-1"
          >
            <div className="flex items-baseline justify-between gap-2 pb-2">
              <h2 id="b-reviews" className="text-[17px] font-bold text-[#111827]">
                최근 리뷰
              </h2>
              {!seller.noReviews && (
                <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-[#111827] tabular-nums">
                  <StarIcon className="w-4 h-4 text-[#0f4c3a]" />
                  {seller.ratingText}
                </span>
              )}
            </div>
            {seller.noReviews ? (
              <div className="py-8 border-t border-[#e5e7eb] text-center space-y-1">
                <p className="text-sm font-semibold text-[#111827]">아직 받은 리뷰가 없어요</p>
                <p className="text-[13px] text-[#6b7280]">구매 확정된 거래가 생기면 여기에 보여요.</p>
              </div>
            ) : (
              <>
                <ul>
                  {reviews.map((review) => (
                    <li key={review.key} className="py-3.5 border-t border-[#e5e7eb] flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <strong className={`text-sm font-semibold ${review.nickname ? 'text-[#111827]' : 'text-[#9ca3af]'}`}>
                          {review.nickname ?? '탈퇴한 회원'}
                        </strong>
                        <Stars rating={review.rating} size="w-3.5 h-3.5" />
                        <span className="ml-auto text-xs text-[#6b7280] tabular-nums">{review.dateText}</span>
                      </div>
                      <span className="text-xs text-[#6b7280]">{review.productText}</span>
                      <p className="text-sm text-[#111827] leading-relaxed line-clamp-2">{review.content}</p>
                    </li>
                  ))}
                </ul>
                <Link
                  to={reviewsTo}
                  state={reviewsState}
                  className="mt-1 h-11 flex items-center justify-center gap-1 bg-white border border-[#d1d5db] text-sm font-semibold text-[#111827]"
                >
                  리뷰 전체 보기
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default SellerShopView;
