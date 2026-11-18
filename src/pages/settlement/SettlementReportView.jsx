import PageBackLink from '../../components/common/PageBackLink';
import { SettlementProductName, SummaryCard } from './SettlementView';

const PERIODS = [
  { value: 'THIS_MONTH', label: '이번 달' },
  { value: 'LAST_MONTH', label: '지난달' },
  { value: 'LAST_3_MONTHS', label: '최근 3개월' },
  { value: 'CUSTOM', label: '직접 선택' },
];

// 시안 08-6-2 정산 리포트 · 08-6-3 빈 리포트 (화면만, 데이터는 props)
// summary = { saleText, saleCountText, feeText, burdenNote, payoutText }
// months = [{ label, height, valueText, selected }] (최근 6개월 막대)
// custom: 직접 선택일 때 기간 입력 { from, to, onFromChange, onToChange }
function SettlementReportView({ period, onPeriodChange, rangeText, custom, summary, months, rows }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[1160px] mx-auto space-y-6">
        <PageBackLink to="/settlements" label="정산" />
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">정산 리포트</h1>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={item.value === period}
                onClick={() => onPeriodChange(item.value)}
                className={`h-10 w-[104px] text-sm font-semibold ${
                  item.value === period ? 'bg-[#0f4c3a] text-white' : 'bg-white border border-[#d1d5db] text-[#111827]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {custom ? (
            <span className="flex items-center gap-2 text-sm text-[#4b5563] tabular-nums">
              <input
                type="date"
                aria-label="시작일"
                className="h-10 px-3 border border-[#d1d5db] text-sm text-[#111827]"
                value={custom.from}
                onChange={(event) => custom.onFromChange(event.target.value)}
              />
              ~
              <input
                type="date"
                aria-label="종료일"
                className="h-10 px-3 border border-[#d1d5db] text-sm text-[#111827]"
                value={custom.to}
                onChange={(event) => custom.onToChange(event.target.value)}
              />
            </span>
          ) : (
            <span className="text-sm text-[#4b5563] tabular-nums">{rangeText}</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="판매 금액" value={summary.saleText} sub={summary.saleCountText} />
          <SummaryCard label="수수료 (5%)" value={summary.feeText} sub={summary.burdenNote} />
          <SummaryCard green label="정산 받은 금액" value={summary.payoutText} />
        </div>
        {rows.length > 0 ? (
          <>
            <section className="bg-white border border-[#e5e7eb] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#111827]">
                  월별 정산 받은 금액 <span className="text-sm font-normal text-[#6b7280]">· 최근 6개월</span>
                </h2>
                <div className="flex items-center gap-4 text-xs text-[#4b5563]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-[#0f4c3a]"></span>선택한 기간
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-[#d1d5db]"></span>그 외
                  </span>
                </div>
              </div>
              <div className="h-[240px] flex items-end gap-4 border-b border-[#e5e7eb] pb-0">
                {months.map((month) => (
                  <div key={month.label} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                    {month.selected ? (
                      <span className="text-xs font-semibold text-[#0f4c3a] tabular-nums">{month.valueText}</span>
                    ) : (
                      <span className="text-xs">&nbsp;</span>
                    )}
                    <span
                      className={`w-12 ${month.selected ? 'bg-[#0f4c3a]' : 'bg-[#d1d5db]'}`}
                      style={{ height: `${month.height}px` }}
                    ></span>
                    <span className="text-xs text-[#6b7280]">{month.label}</span>
                  </div>
                ))}
              </div>
            </section>
            <h2 className="pt-2 text-lg font-bold text-[#111827]">정산 내역</h2>
            <table className="w-full bg-white border border-[#e5e7eb] text-sm">
              <thead>
                <tr className="bg-[#f9fafb] text-[13px] text-[#4b5563] text-left">
                  <th className="px-5 py-3 font-semibold">정산일</th>
                  <th className="px-5 py-3 font-semibold">주문번호</th>
                  <th className="px-5 py-3 font-semibold">상품</th>
                  <th className="px-5 py-3 font-semibold text-right">판매 금액</th>
                  <th className="px-5 py-3 font-semibold text-right">수수료</th>
                  <th className="px-5 py-3 font-semibold text-right">판매자 부담금</th>
                  <th className="px-5 py-3 font-semibold text-right">정산 금액</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={`border-t border-[#e5e7eb]${row.rowTone ? ` ${row.rowTone}` : ''}`}>
                    <td className="px-5 py-3.5 text-[#4b5563] tabular-nums">{row.dateText}</td>
                    <td className="px-5 py-3.5 text-[#6b7280] text-xs tabular-nums">{row.orderNo}</td>
                    <td className="px-5 py-3.5">
                      <SettlementProductName row={row} />
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-[#111827]">{row.saleText}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-[#4b5563]">{row.feeText}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-[#4b5563]">{row.burdenText}</td>
                    <td className="px-5 py-3.5 text-right font-bold tabular-nums text-[#111827]">{row.payoutText}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div className="bg-white border border-[#e5e7eb] px-6 py-20 flex flex-col items-center text-center gap-3">
            <h2 className="text-xl font-bold text-[#111827]">선택한 기간에 정산된 내역이 없어요</h2>
            <p className="text-[15px] text-[#4b5563]">구매 확정된 판매 건이 정산되면 여기에 쌓여요.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default SettlementReportView;
