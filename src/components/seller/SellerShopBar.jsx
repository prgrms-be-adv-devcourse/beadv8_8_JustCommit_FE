import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon } from '../review/Stars';

// 판매자 상점 맨 위 판매자 한 줄 (시안 02-3-1 · 02-3-2 · 02-3-3 · 02-3-4 공통)
// seller = { nickname, ratingText, reviewCountText, soldCountText, intro(판매자 소개글, 비었으면 줄을 숨김),
//           noReviews(true면 별점 자리에 「아직 리뷰 없음」), hasReviews(true면 「리뷰 전체 보기」를 보일 수 있음) }
// 별점 칸은 시안 02-3-3 모양. 상점 시안(02-3-1 · 02-3-4)에는 별점 칸이 없어 같은 모양을 씀
// introEditTo = 내 상점일 때만 주는 소개글 수정 화면 주소 (있으면 「소개 수정」 링크를 보임)
// reviewsTo · reviewsState = 「리뷰 전체 보기」 이동할 곳 · router state (리뷰 전체 화면에서는 주지 않음)
function SellerShopBar({ seller, introEditTo, reviewsTo, reviewsState }) {
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
      {/* 좁은 화면에서 구분점(·)만 줄 끝 · 줄 앞에 남지 않도록 뒤 항목과 묶음. 묶음 사이에서는 줄바꿈됨 */}
      <span className="inline-flex items-center gap-x-3.5 whitespace-nowrap">
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
      </span>
      {reviewsTo && seller.hasReviews && (
        <Link to={reviewsTo} state={reviewsState} className="text-[13px] font-semibold text-[#0f4c3a] underline">
          리뷰 전체 보기
        </Link>
      )}
      <span className="inline-flex items-center gap-x-3.5 whitespace-nowrap">
        <span aria-hidden="true" className="text-[#d1d5db]">
          ·
        </span>
        <span className="text-[#4b5563]">
          {'판매 완료 '}
          <strong className="font-semibold text-[#111827] tabular-nums">{seller.soldCountText}</strong>
        </span>
      </span>
      {introEditTo && (
        <Link to={introEditTo} className="ml-auto text-[13px] font-semibold text-[#0f4c3a] underline">
          소개 수정
        </Link>
      )}
      {seller.intro && <SellerIntro key={seller.intro} intro={seller.intro} />}
    </section>
  );
}

// 판매자 소개글 한 단락: 2줄에서 자르고 「더 보기」를 누르면 전체를 펼침
// 시안은 글 길이와 상관없이 「더 보기」를 그려서 그대로 둠 (짧은 글이면 눌러도 모양이 같음)
function SellerIntro({ intro }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="basis-full flex items-end gap-3 pt-1">
      <p className={`flex-1 text-sm text-[#4b5563] leading-relaxed ${expanded ? 'whitespace-pre-line' : 'line-clamp-2'}`}>{intro}</p>
      {!expanded && (
        <button type="button" className="text-[13px] font-semibold text-[#0f4c3a] underline shrink-0" onClick={() => setExpanded(true)}>
          더 보기
        </button>
      )}
    </div>
  );
}

export default SellerShopBar;
