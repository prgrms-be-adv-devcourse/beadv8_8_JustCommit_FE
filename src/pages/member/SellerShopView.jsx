import { Link } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import Stars, { StarIcon } from '../../components/review/Stars';

// 판매자 상점 B안 · 상품 중심 (시안 02-4-4, 판매 중 상품 없음 02-4-5)
// seller = { nickname, ratingText, reviewCountText, soldCountText }
// products = [ ProductCard의 product ], productCountText = "8개"
// reviews = [{ key, nickname(null = 탈퇴한 회원), rating, dateText, productText, content }]
// backTo = 「< 상품 상세」 이동할 곳, reviewsTo = 「리뷰 전체 보기」 이동할 곳 (null이면 이동 안 함)
function SellerShopView({ seller, products, productCountText, reviews, backTo, reviewsTo }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="space-y-6">
        <Link to={backTo} className="h-11 inline-flex items-center gap-1.5 text-sm font-medium text-[#4b5563]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          상품 상세
        </Link>
        <section
          aria-label="판매자 정보"
          className="bg-white border border-[#e5e7eb] px-5 py-3 flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[15px]"
        >
          <span
            aria-hidden="true"
            className="w-9 h-9 flex items-center justify-center bg-[#f4f8f6] border border-[#d1e7dd] text-[#0f4c3a] text-sm font-bold"
            // 전역 규칙(모서리 0px !important)을 이기려고 시안처럼 9999px !important (CountBadge와 같은 방식)
            ref={(el) => el?.style.setProperty('border-radius', '9999px', 'important')}
          >
            {seller.nickname.charAt(0)}
          </span>
          <h1 className="text-lg font-bold text-[#111827]">{seller.nickname}</h1>
          <span aria-hidden="true" className="text-[#d1d5db]">
            ·
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-[#111827] tabular-nums">
            <StarIcon className="w-[18px] h-[18px] text-[#0f4c3a]" />
            {`${seller.ratingText} `}
            <span className="font-normal text-[#4b5563]">{`(${seller.reviewCountText})`}</span>
          </span>
          <span aria-hidden="true" className="text-[#d1d5db]">
            ·
          </span>
          <span className="text-[#4b5563]">
            {'판매 완료 '}
            <strong className="font-semibold text-[#111827] tabular-nums">{seller.soldCountText}</strong>
          </span>
        </section>
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
                <p className="text-[15px] text-[#4b5563]">오른쪽에서 이 판매자의 리뷰를 확인해 보세요.</p>
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
              <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-[#111827] tabular-nums">
                <StarIcon className="w-4 h-4 text-[#0f4c3a]" />
                {seller.ratingText}
              </span>
            </div>
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
            {/* TODO: 「리뷰 전체 보기」 이동할 화면이 아직 없음 (리뷰 탭은 A안에만 있었음). 정해지면 reviewsTo로 연결 */}
            <Link
              to={reviewsTo ?? '#'}
              onClick={reviewsTo ? undefined : (event) => event.preventDefault()}
              className="mt-1 h-11 flex items-center justify-center gap-1 bg-white border border-[#d1d5db] text-sm font-semibold text-[#111827]"
            >
              리뷰 전체 보기
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default SellerShopView;
