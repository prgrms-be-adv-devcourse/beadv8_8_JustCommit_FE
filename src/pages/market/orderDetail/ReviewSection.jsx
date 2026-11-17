import { Link } from 'react-router-dom';
import { StarIcon } from './icons';

// 시안 05-1 주문 상세 리뷰 영역
// review = { notice: { text, tone: 'muted' | 'success' }, rows: [...], myReviews: [...] }
// rows[] = { key, sellerName, itemsText, state: 'locked' | 'ready' | 'done' | 'expired', deadline, writeTo }
// myReviews[] = { key, rating, ratingLabel, meta, tags[], content, itemsText }

const NOTICE_CLASS = {
  muted: 'px-4 py-3 text-sm font-semibold text-[#4b5563] bg-[#f3f4f6]',
  success: 'px-4 py-3 text-sm font-semibold text-[#0f4c3a] bg-[#f4f8f6] border border-[#d1e7dd]',
};

function DisabledWriteButton() {
  return (
    <button type="button" disabled className="h-9 px-4 bg-[#f3f4f6] text-[#9ca3af] text-sm font-bold cursor-not-allowed">
      리뷰 작성
    </button>
  );
}

function RowAction({ row }) {
  if (row.state === 'done') {
    return (
      <span className="h-7 px-2.5 flex items-center border border-[#0f4c3a] text-[#0f4c3a] text-[13px] font-semibold">
        작성 완료
      </span>
    );
  }
  if (row.state === 'ready') {
    return (
      <>
        <span className="text-[13px] text-[#92400e] font-medium">{row.deadline}</span>
        <Link to={row.writeTo} className="h-9 px-4 flex items-center bg-[#0f4c3a] text-white text-sm font-bold">
          리뷰 작성
        </Link>
      </>
    );
  }
  return (
    <>
      <span className="text-[13px] text-[#6b7280]">
        {row.state === 'expired' ? '작성 기간이 지났어요' : '구매 확정 전 상품이 있어요'}
      </span>
      <DisabledWriteButton />
    </>
  );
}

// 별점: 0.5 단위 (반 별은 회색 별 위에 초록 별 왼쪽 절반)
function Stars({ rating }) {
  return (
    <span className="flex items-center">
      {[1, 2, 3, 4, 5].map((n) => {
        if (rating >= n) return <StarIcon key={n} color="text-[#0f4c3a]" />;
        if (rating >= n - 0.5) {
          return (
            <span key={n} className="relative w-4 h-4">
              <StarIcon color="text-[#d1d5db]" />
              <span className="absolute inset-0 overflow-hidden w-1/2">
                <StarIcon color="text-[#0f4c3a]" />
              </span>
            </span>
          );
        }
        return <StarIcon key={n} color="text-[#d1d5db]" />;
      })}
    </span>
  );
}

function MyReview({ review }) {
  return (
    <div className="border border-[#e5e7eb] p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Stars rating={review.rating} />
        <span className="text-sm font-bold text-[#111827]">{review.ratingLabel}</span>
        <span className="ml-auto text-[13px] text-[#6b7280]">{review.meta}</span>
      </div>
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
      <p className="text-sm text-[#111827] leading-relaxed">{review.content}</p>
      <p className="text-[13px] text-[#6b7280]">{review.itemsText}</p>
    </div>
  );
}

function ReviewSection({ review }) {
  return (
    <section className="bg-white border border-[#e5e7eb] p-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-[#111827]">리뷰</h2>
        <span className="text-[13px] text-[#6b7280]">판매자마다 리뷰 1개 · 구매 확정 후 3일 안에 쓸 수 있어요</span>
      </div>
      <p className={NOTICE_CLASS[review.notice.tone]}>{review.notice.text}</p>
      <ul className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
        {review.rows.map((row) => (
          <li key={row.key} className="px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-[#111827]">{row.sellerName}</p>
              <p className="text-[13px] text-[#6b7280] truncate">{row.itemsText}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <RowAction row={row} />
            </div>
          </li>
        ))}
      </ul>
      {review.myReviews.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#4b5563]">내가 쓴 리뷰</p>
          {review.myReviews.map((item) => (
            <MyReview key={item.key} review={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export default ReviewSection;
