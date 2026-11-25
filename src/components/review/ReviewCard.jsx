import Stars from './Stars';

// 탈퇴 · 복제본 없는 작성자 (BE가 닉네임 자리에 넣는 문구). 시안 05-3-4처럼 회색 「?」 아바타와 회색 이름
const UNKNOWN_WRITERS = ['탈퇴한 회원', '알 수 없는 회원'];

// 리뷰 카드 한 장 (시안 02-3-3 판매자 리뷰 전체 · 05-3 리뷰 관리 공통)
// review = { nickname, rating, ratingText, dateText, content, productText, tags(태그 이름 목록, 없거나 비면 줄을 숨김) }
// as = 감싸는 태그 (목록 안이면 'li')
function ReviewCard({ review, as: Tag = 'div' }) {
  const unknownWriter = UNKNOWN_WRITERS.includes(review.nickname);
  return (
    <Tag className="bg-white border border-[#e5e7eb] p-5 space-y-3">
      <div className="flex items-center gap-3">
        {unknownWriter ? (
          <span className="w-9 h-9 flex items-center justify-center bg-[#f3f4f6] text-[#9ca3af] text-sm font-bold shrink-0">
            ?
          </span>
        ) : (
          <span className="w-9 h-9 flex items-center justify-center bg-[#f4f8f6] border border-[#d1e7dd] text-[#0f4c3a] text-sm font-bold shrink-0">
            {review.nickname.charAt(0)}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p
            className={`text-[15px] font-semibold ${unknownWriter ? 'text-[#9ca3af]' : 'text-[#111827]'}`}
          >
            {review.nickname}
          </p>
          {/* 좁은 화면에서는 별 아래로 내려가도 「5.0점 · 최고예요」는 한 덩어리로 */}
          <div className="flex flex-wrap items-center gap-x-2">
            <Stars rating={review.rating} />
            <span className="text-[13px] font-semibold text-[#111827] tabular-nums whitespace-nowrap">
              {review.ratingText}
            </span>
          </div>
        </div>
        <span className="text-[13px] text-[#6b7280] tabular-nums">{review.dateText}</span>
      </div>
      {review.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="h-7 px-2.5 flex items-center bg-[#f4f8f6] border border-[#d1e7dd] text-[13px] text-[#0f4c3a]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {/* 시안은 줄바꿈을 <br>로 그림. 작성한 글의 줄바꿈을 그대로 보여 줌 */}
      <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-line">{review.content}</p>
      {review.productText && <p className="text-[13px] text-[#6b7280]">{review.productText}</p>}
    </Tag>
  );
}

export default ReviewCard;
