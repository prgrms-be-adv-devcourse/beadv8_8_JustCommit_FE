import PageBackLink from '../../components/common/PageBackLink';
import { won } from './chargeUtils';

const BADGE_DONE = 'h-7 px-2.5 inline-flex items-center text-xs font-semibold bg-[#f4f8f6] border border-[#d1e7dd] text-[#0f4c3a]';
const BADGE_GRAY = 'h-7 px-2.5 inline-flex items-center text-xs font-semibold bg-[#e5e7eb] text-[#4b5563]';

// 충전 상태 → 배지 (시안에는 충전 완료만 있음, 나머지는 회색으로). 상태가 없으면(불러오기 전 줄) null → 배지 숨김
function statusBadge(charge) {
  if (!charge.status) return null;
  if (charge.status === 'PENDING') return { label: '충전 처리 중', className: BADGE_GRAY };
  if (charge.status === 'REVIEW_REQUIRED') return { label: '확인 중', className: BADGE_GRAY };
  return { label: '충전 완료', className: BADGE_DONE };
}

// 시안 07-3-1 충전 내역 (충전 취소는 하지 않기로 함)
// charges: [{ chargeId, approvedAt('2026.10.15 14:20'), amount, status }]
function ChargeHistoryView({ charges }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[960px] mx-auto space-y-6">
        <PageBackLink to="/wallet" label="예치금" />
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">충전 내역</h1>
        </div>
        <table className="w-full bg-white border border-[#e5e7eb] text-sm">
          <thead>
            <tr className="bg-[#f9fafb] text-[13px] text-[#4b5563] text-left">
              <th className="px-6 py-3 font-semibold">충전일</th>
              <th className="px-6 py-3 font-semibold text-left">금액</th>
              <th className="px-6 py-3 font-semibold">상태</th>
            </tr>
          </thead>
          <tbody>
            {charges.map((charge) => {
              const badge = statusBadge(charge);
              return (
                <tr key={charge.chargeId} className="border-t border-[#e5e7eb]">
                  <td className="px-6 py-4 text-[#4b5563] tabular-nums">{charge.approvedAt}</td>
                  <td className="px-6 py-4 text-left">
                    <span className="text-base font-bold tabular-nums text-[#111827]">{won(charge.amount)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {badge && <span className={badge.className}>{badge.label}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default ChargeHistoryView;
