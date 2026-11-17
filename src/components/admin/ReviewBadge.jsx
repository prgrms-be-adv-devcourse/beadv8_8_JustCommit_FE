import { REVIEW_BADGE_CLASS } from '../../constants/imageReview';

// 사진 검수 「확인할 이유」 배지 (시안 09-2-1 목록 · 09-2-2 상세)
// type: APPEAL · REJECTED · BANNED_SUSPECT · 그 밖(회색)
function ReviewBadge({ type, children }) {
  const color = REVIEW_BADGE_CLASS[type] ?? REVIEW_BADGE_CLASS.DEFAULT;
  return (
    <span className={`h-7 px-2.5 inline-flex items-center text-xs font-semibold ${color}`}>
      {children}
    </span>
  );
}

export default ReviewBadge;
