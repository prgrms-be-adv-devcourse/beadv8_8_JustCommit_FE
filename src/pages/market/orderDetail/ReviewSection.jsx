import { Link } from 'react-router-dom';
import { ActionErrorLine } from '../../../components/common/ActionError';
import Stars from '../../../components/review/Stars';
import { REVIEW_STATUS } from '../review/reviewModel';

// 시안 05-1 주문 상세 리뷰 영역 (05-1-1 확정 전 · 05-1-2 모두 확정 · 05-1-3 일부 작성)
// review = buildOrderReviewSection 결과 { notice: { text, tone }, rows, myReviews }
// errorMessage = 리뷰 상태를 불러오지 못했을 때 (영역은 남기고 안내만)

const NOTICE_CLASS = {
  muted: 'px-4 py-3 text-sm font-semibold text-[#4b5563] bg-[#f3f4f6]',
  success: 'px-4 py-3 text-sm font-semibold text-[#0f4c3a] bg-[#f4f8f6] border border-[#d1e7dd]',
};

function DisabledWriteButton() {
  return (
    <button
      type="button"
      disabled
      className="h-9 px-4 bg-[#f3f4f6] text-[#9ca3af] text-sm font-bold cursor-not-allowed"
    >
      리뷰 작성
    </button>
  );
}

function RowAction({ row }) {
  if (row.status === 'WRITABLE') {
    return (
      <>
        <span className="text-[13px] text-[#92400e] font-medium">{`${row.deadlineText}까지 작성 가능`}</span>
        <Link
          to={row.writeTo}
          className="h-9 px-4 flex items-center bg-[#0f4c3a] text-white text-sm font-bold"
        >
          리뷰 작성
        </Link>
      </>
    );
  }
  if (row.status === 'WRITTEN') {
    return (
      <span className="h-7 px-2.5 flex items-center border border-[#0f4c3a] text-[#0f4c3a] text-[13px] font-semibold">
        작성 완료
      </span>
    );
  }
  // 삭제함: 작성 완료와 같은 자리에 회색 표시 (시안에 없는 상태)
  if (row.status === 'DELETED') {
    return (
      <>
        <span className="text-[13px] text-[#6b7280]">{REVIEW_STATUS.DELETED.rowText}</span>
        <span className="h-7 px-2.5 flex items-center border border-[#d1d5db] text-[#6b7280] text-[13px] font-semibold">
          삭제함
        </span>
      </>
    );
  }
  // 구매 확정 상품 없음(전부 반품 · 취소)은 앞으로도 쓸 수 없어 버튼 없이 안내만
  if (row.status === 'NO_CONFIRMED_ITEM') {
    return (
      <span className="text-[13px] text-[#6b7280]">{REVIEW_STATUS.NO_CONFIRMED_ITEM.rowText}</span>
    );
  }
  return (
    <>
      <span className="text-[13px] text-[#6b7280]">{REVIEW_STATUS[row.status]?.rowText}</span>
      <DisabledWriteButton />
    </>
  );
}

function MyReview({ review }) {
  return (
    <div className="border border-[#e5e7eb] p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars rating={review.rating} />
        <span className="text-sm font-bold text-[#111827] whitespace-nowrap">
          {review.ratingText}
        </span>
        <span className="ml-auto text-[13px] text-[#6b7280]">{review.meta}</span>
      </div>
      {review.tags.length > 0 && (
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
      <p className="text-sm text-[#111827] leading-relaxed whitespace-pre-line">{review.content}</p>
      <p className="text-[13px] text-[#6b7280]">{review.itemsText}</p>
    </div>
  );
}

function ReviewSection({ review, errorMessage }) {
  if (!review && !errorMessage) return null;
  return (
    <section
      className="bg-white border border-[#e5e7eb] p-6 space-y-4"
      aria-labelledby="order-review-title"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="order-review-title" className="text-lg font-bold text-[#111827]">
          리뷰
        </h2>
        <span className="text-[13px] text-[#6b7280]">
          판매자마다 리뷰 1개 · 구매 확정 후 3일 안에 쓸 수 있어요
        </span>
      </div>
      {errorMessage ? (
        <ActionErrorLine message={errorMessage} className="" />
      ) : (
        <>
          <p className={NOTICE_CLASS[review.notice.tone]}>{review.notice.text}</p>
          <ul className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
            {review.rows.map((row) => (
              <li key={row.key} className="px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex-1 min-w-[160px]">
                  <p className="text-[15px] font-semibold text-[#111827]">{row.sellerName}</p>
                  <p className="text-[13px] text-[#6b7280] truncate">{row.itemsText}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-auto">
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
        </>
      )}
    </section>
  );
}

export default ReviewSection;
