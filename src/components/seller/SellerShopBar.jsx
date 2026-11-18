import { StarIcon } from '../review/Stars';

// 판매자 상점 맨 위 판매자 한 줄 (시안 02-4-4 상점 · 02-4-6 리뷰 전체 · 02-4-7 리뷰 없음 공통)
// seller = { nickname, ratingText, reviewCountText, soldCountText, noReviews(true면 별점 자리에 「아직 리뷰 없음」) }
function SellerShopBar({ seller }) {
  return (
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
      {seller.noReviews ? (
        <span className="text-[#4b5563]">아직 리뷰 없음</span>
      ) : (
        <span className="inline-flex items-center gap-1 font-semibold text-[#111827] tabular-nums">
          <StarIcon className="w-[18px] h-[18px] text-[#0f4c3a]" />
          {`${seller.ratingText} `}
          <span className="font-normal text-[#4b5563]">{`(${seller.reviewCountText})`}</span>
        </span>
      )}
      <span aria-hidden="true" className="text-[#d1d5db]">
        ·
      </span>
      <span className="text-[#4b5563]">
        {'판매 완료 '}
        <strong className="font-semibold text-[#111827] tabular-nums">{seller.soldCountText}</strong>
      </span>
    </section>
  );
}

export default SellerShopBar;
