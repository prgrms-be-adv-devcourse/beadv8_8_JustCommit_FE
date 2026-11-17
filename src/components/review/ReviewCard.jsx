import { formatRating, getTagLabel } from '../../constants/review';
import Stars from './Stars';

// 리뷰 카드 (시안 05-3 리뷰 관리 · 받은 리뷰)
// review = { reviewerNickname(null = 탈퇴한 회원), rating, dateText, tags[], content, productNames[] }
function ReviewCard({ review }) {
  const withdrawn = !review.reviewerNickname;
  return (
    <div className="bg-white border border-[#e5e7eb] p-5 space-y-3">
      <div className="flex items-center gap-3">
        {withdrawn ? (
          <span className="w-9 h-9 flex items-center justify-center bg-[#f3f4f6] text-[#9ca3af] text-sm font-bold shrink-0">?</span>
        ) : (
          <span className="w-9 h-9 flex items-center justify-center bg-[#f4f8f6] border border-[#d1e7dd] text-[#0f4c3a] text-sm font-bold shrink-0">
            {review.reviewerNickname.slice(0, 1)}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-[15px] font-semibold ${withdrawn ? 'text-[#9ca3af]' : 'text-[#111827]'}`}>
            {withdrawn ? '탈퇴한 회원' : review.reviewerNickname}
          </p>
          <div className="flex items-center gap-2">
            <Stars rating={review.rating} />
            <span className="text-[13px] font-semibold text-[#111827]">{formatRating(review.rating)}</span>
          </div>
        </div>
        <span className="text-[13px] text-[#6b7280] tabular-nums">{review.dateText}</span>
      </div>
      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.tags.map((tag) => (
            <span key={tag} className="h-7 px-2.5 flex items-center bg-[#f4f8f6] border border-[#d1e7dd] text-[13px] text-[#0f4c3a]">
              {getTagLabel(tag)}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm text-[#111827] leading-relaxed">{review.content}</p>
      <p className="text-[13px] text-[#6b7280]">{`구매 상품 · ${review.productNames.join(', ')}`}</p>
    </div>
  );
}

export default ReviewCard;
