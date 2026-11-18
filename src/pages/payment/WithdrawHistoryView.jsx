import { Link } from 'react-router-dom';
import InfoNote from '../../components/common/InfoNote';
import PageBackLink from '../../components/common/PageBackLink';
import { won } from './chargeUtils';

const BADGE_REQUESTED = 'h-7 px-2.5 inline-flex items-center text-xs font-semibold bg-white border border-[#0f4c3a] text-[#0f4c3a]';
const BADGE_GRAY = 'h-7 px-2.5 inline-flex items-center text-xs font-semibold bg-[#e5e7eb] text-[#4b5563]';

// 인출 상태 → 배지 (시안에는 신청됨 · 인출 완료만 있음, 이체 실패는 회색으로)
const STATUS = {
  REQUESTED: { label: '신청됨', className: BADGE_REQUESTED },
  COMPLETED: { label: '인출 완료', className: BADGE_GRAY },
  FAILED: { label: '이체 실패', className: BADGE_GRAY },
};

// 시안 07-4-3 인출 내역 · 07-4-4 인출 내역 빈 상태
// cashOuts: [{ cashOutId, requestedAt('2026.10.15 11:02'), amount, account('KB국민은행 ***4567'), status }]
function WithdrawHistoryView({ cashOuts }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[960px] mx-auto space-y-6">
        <PageBackLink to="/wallet" label="예치금" />
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">인출 내역</h1>
          <Link
            to="/wallet/withdraw"
            className="h-10 w-[120px] flex items-center justify-center bg-[#0f4c3a] text-white text-sm font-semibold"
          >
            인출하기
          </Link>
        </div>
        {cashOuts.length === 0 ? (
          <div className="bg-white border border-[#e5e7eb] px-6 py-20 flex flex-col items-center text-center gap-3">
            <h2 className="text-xl font-bold text-[#111827]">아직 인출 내역이 없어요</h2>
            <p className="text-[15px] text-[#4b5563]">판매 정산금을 인출하면 여기에서 진행 상태를 볼 수 있어요.</p>
          </div>
        ) : (
          <>
            <table className="w-full bg-white border border-[#e5e7eb] text-sm">
              <thead>
                <tr className="bg-[#f9fafb] text-[13px] text-[#4b5563] text-left">
                  <th className="px-6 py-3 font-semibold">신청일</th>
                  <th className="px-6 py-3 font-semibold text-right">금액</th>
                  <th className="px-6 py-3 font-semibold">받는 계좌</th>
                  <th className="px-6 py-3 font-semibold">상태</th>
                </tr>
              </thead>
              <tbody>
                {cashOuts.map((cashOut) => {
                  const status = STATUS[cashOut.status] ?? { label: cashOut.status, className: BADGE_GRAY };
                  return (
                    <tr key={cashOut.cashOutId} className="border-t border-[#e5e7eb]">
                      <td className="px-6 py-4 text-[#4b5563] tabular-nums">{cashOut.requestedAt}</td>
                      <td className="px-6 py-4 text-right text-base font-bold text-[#111827] tabular-nums">
                        {won(cashOut.amount)}
                      </td>
                      <td className="px-6 py-4 text-[#111827] tabular-nums">{cashOut.account}</td>
                      <td className="px-6 py-4">
                        <span className={status.className}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <InfoNote>인출은 신청할 때의 계좌로 들어가요. 신청한 뒤에는 취소할 수 없어요.</InfoNote>
          </>
        )}
      </div>
    </main>
  );
}

export default WithdrawHistoryView;
