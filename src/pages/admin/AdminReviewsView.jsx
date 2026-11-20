import { Link } from 'react-router-dom';
import ReviewBadge from '../../components/admin/ReviewBadge';
import InfoNote from '../../components/common/InfoNote';
import { REVIEW_OVERDUE_MINUTES } from '../../constants/imageReview';
import { formatDuration } from '../../utils/adminFormat';
import { formatPrice } from '../../utils/format';
import { EMPTY, orEmpty } from '../../constants/emptyText';

// 시안 09-2-1 사진 검수 목록 (AdminReviews)
// data: null이면 값 자리에 「-」 (API 응답 모양은 api/adminApi.js 참고)
function AdminReviewsView({ data }) {
  const reviews = data?.reviews ?? [];
  const count = (value) => (value == null ? EMPTY : `${value}건`);

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-8 pb-16">
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">사진 검수</h1>
          <p className="text-sm text-[#4b5563]">
            자동 검수로 판단하지 못한 상품과 이의 신청이에요. 오래된 순으로 보여요.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-6 border bg-white border-[#e5e7eb] space-y-1">
            <p className="text-sm text-[#4b5563]">확인 대기</p>
            <p className="text-[26px] font-black text-[#111827] tabular-nums">
              {count(data?.pendingCount)}
            </p>
          </div>
          <div className="p-6 border bg-[#fffbeb] border-[#fde68a] space-y-1">
            <p className="text-sm text-[#4b5563]">12시간 넘게 기다리는 상품</p>
            <p className="text-[26px] font-black text-[#111827] tabular-nums">
              {count(data?.overdueCount)}
            </p>
          </div>
          <div className="p-6 border bg-white border-[#e5e7eb] space-y-1">
            <p className="text-sm text-[#4b5563]">이의 신청</p>
            <p className="text-[26px] font-black text-[#111827] tabular-nums">
              {count(data?.appealCount)}
            </p>
          </div>
        </div>
        <table className="w-full bg-white border border-[#e5e7eb] text-sm">
          <thead>
            <tr className="bg-[#f9fafb] text-[13px] text-[#4b5563] text-left">
              <th className="px-5 py-3 font-semibold">기다린 시간</th>
              <th className="px-5 py-3 font-semibold">상품</th>
              <th className="px-5 py-3 font-semibold">판매자 · 선택 품종</th>
              <th className="px-5 py-3 font-semibold">확인할 이유</th>
              <th className="px-5 py-3 font-semibold">자동 반려까지</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => {
              const overdue = review.waitedMinutes >= REVIEW_OVERDUE_MINUTES;
              return (
                <tr
                  key={review.imageReviewId}
                  className={`border-t border-[#e5e7eb] ${overdue ? 'bg-[#fffbeb]' : ''}`}
                >
                  <td className="px-5 py-4 tabular-nums text-[#111827] whitespace-nowrap">
                    {formatDuration(review.waitedMinutes)}
                    {overdue && (
                      <span className="ml-2 h-6 px-2 inline-flex items-center bg-[#fffbeb] border border-[#fde68a] text-xs font-semibold text-[#92400e]">
                        12시간 지남
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-[#111827]">{review.productName}</p>
                    <p className="text-xs text-[#6b7280]">{`사진 ${orEmpty(review.photoCount)}장 · ${review.price == null ? EMPTY : formatPrice(review.price)}`}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[#111827]">{orEmpty(review.sellerNickname)}</p>
                    <p className="text-xs text-[#6b7280]">{`선택 품종 · ${orEmpty(review.selectedSpeciesName)}`}</p>
                  </td>
                  <td className="px-5 py-4">
                    <ReviewBadge type={review.reason.type}>{review.reason.text}</ReviewBadge>
                  </td>
                  <td
                    className={`px-5 py-4 tabular-nums ${overdue ? 'font-bold text-[#92400e]' : 'text-[#4b5563]'}`}
                  >
                    {formatDuration(review.remainingMinutes)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to={`/admin/reviews/${review.imageReviewId}`}
                      className="h-9 w-[88px] inline-flex items-center justify-center bg-[#0f4c3a] text-white text-sm font-semibold"
                    >
                      확인하기
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <InfoNote>
          관리자 확인으로 넘어오고 12시간이 지나면 대기 건수를 묶어 알려 드려요. 24시간 안에
          처리하지 못하면 &quot;확인이 늦어져 반려됐어요&quot;로 자동 반려되고, 판매자는 횟수 제한
          없이 다시 신청할 수 있어요.
        </InfoNote>
      </div>
    </main>
  );
}

export default AdminReviewsView;
