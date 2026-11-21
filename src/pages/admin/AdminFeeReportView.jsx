import DailyRevenueChart from '../../components/admin/DailyRevenueChart';
import InfoNote from '../../components/common/InfoNote';
import { formatMinus, formatNumber, formatReportDate } from '../../utils/adminFormat';
import { FEE_RATE_PERCENT, REPORT_PERIODS } from '../../constants/adminReport';
import { EMPTY, orEmpty } from '../../constants/emptyText';

const won = (value) => (value == null ? EMPTY : `${formatNumber(value)}원`);

// 값이 없는 칸은 0으로 더함 (NaN 방지)
const sum = (rows, key) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);

// 순수익 = 수수료 + 판매자 부담금 · 총 입금 = 순수익 + 배송비 수납 − 배송비 환불
function withTotals(row) {
  const netRevenue = row.fee + row.sellerBurden;
  return {
    ...row,
    netRevenue,
    totalDeposit: netRevenue + row.shippingCollected - row.shippingRefunded,
  };
}

// 시안 09-3-1 이번 달 (AdminFeeReport) · 09-3-2 이번 주 (AdminFeeReportWeek)
// period: REPORT_PERIODS의 key. report: null이면 값 자리에 「-」 (API 응답 모양은 api/adminApi.js 참고)
// onPeriodChange(key) · onDownloadCsv(): 버튼
function AdminFeeReportView({ period, report, onPeriodChange, onDownloadCsv }) {
  const daily = (report?.daily ?? []).map(withTotals);
  const has = report != null;
  const total = {
    settlementCount: sum(daily, 'settlementCount'),
    fee: sum(daily, 'fee'),
    sellerBurden: sum(daily, 'sellerBurden'),
    netRevenue: sum(daily, 'netRevenue'),
    shippingCollected: sum(daily, 'shippingCollected'),
    shippingRefunded: sum(daily, 'shippingRefunded'),
    totalDeposit: sum(daily, 'totalDeposit'),
  };
  const rangeText = has
    ? `${formatReportDate(report.from).day} ~ ${formatReportDate(report.to).day}`
    : EMPTY;
  const ascending = [...daily].sort((a, b) => a.date.localeCompare(b.date));
  const descending = [...ascending].reverse();

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-8 pb-16">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">수수료 · 배송비 리포트</h1>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {REPORT_PERIODS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={key === period}
                className={`h-10 w-[104px] text-sm font-semibold ${
                  key === period
                    ? 'bg-[#0f4c3a] text-white'
                    : 'bg-white border border-[#d1d5db] text-[#111827]'
                }`}
                onClick={() => onPeriodChange(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-sm text-[#4b5563] tabular-nums">{rangeText}</span>
        </div>
        <section className="grid grid-cols-[1.3fr_1fr_1fr] gap-4">
          <div className="p-7 bg-[#0f4c3a] text-white space-y-2">
            <p className="text-sm text-white/80">순수익</p>
            <p className="text-[40px] leading-tight font-black tabular-nums tracking-tight">
              {has ? won(total.netRevenue) : EMPTY}
            </p>
            <p className="text-[13px] text-white/80">
              수수료 수입 + 판매자 부담금 · 플랫폼이 실제로 버는 돈
            </p>
          </div>
          <div className="p-6 bg-white border border-[#e5e7eb] space-y-1">
            <p className="text-sm text-[#4b5563]">수수료 수입</p>
            <p className="text-[26px] font-black tabular-nums tracking-tight">
              {has ? won(total.fee) : EMPTY}
            </p>
            <p className="text-[13px] text-[#6b7280]">
              {`거래 금액 ${has ? won(report.tradeAmount) : EMPTY}의 ${FEE_RATE_PERCENT}%`}
            </p>
          </div>
          <div className="p-6 bg-white border border-[#e5e7eb] space-y-1">
            <p className="text-sm text-[#4b5563]">판매자 부담금</p>
            <p className="text-[26px] font-black tabular-nums tracking-tight">
              {has ? won(total.sellerBurden) : EMPTY}
            </p>
            <p className="text-[13px] text-[#6b7280]">
              {`반품 ${has ? orEmpty(report.returnCount) : EMPTY}건의 반품 배송비`}
            </p>
          </div>
        </section>
        <section className="grid grid-cols-4 gap-4">
          {[
            [
              '정산 받은 판매자',
              has ? `${formatNumber(report.settledSellerCount)}명` : EMPTY,
            ],
            ['거래 건수', has ? `${formatNumber(report.tradeCount)}건` : EMPTY],
            ['판매자당 평균 정산액', has ? won(report.averagePayout) : EMPTY],
            ['반품률', has && report.returnRate != null ? `${report.returnRate}%` : EMPTY],
          ].map(([label, value]) => (
            <div key={label} className="px-5 py-4 bg-white border border-[#e5e7eb] space-y-0.5">
              <p className="text-[13px] text-[#6b7280]">{label}</p>
              <p className="text-lg font-bold tabular-nums text-[#111827]">{value}</p>
            </div>
          ))}
        </section>
        <section className="bg-white border border-[#e5e7eb] p-6 space-y-3">
          <h2 className="text-base font-bold text-[#111827]">일별 순수익</h2>
          <DailyRevenueChart
            points={ascending.map((row) => ({ date: row.date, value: row.netRevenue }))}
            rangeText={rangeText}
          />
        </section>
        <section className="bg-[#f9fafb] border border-[#e5e7eb] p-6 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-[#111827]">
              대신 받아 둔 배송비{' '}
              <span className="text-sm font-normal text-[#6b7280]">
                · 택배사에 넘길 돈이라 순수익에 넣지 않아요
              </span>
            </h2>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-[#e5e7eb] bg-white border border-[#e5e7eb]">
            <div className="px-6 py-4 space-y-1">
              <dt className="text-sm text-[#4b5563]">배송비 수납</dt>
              <dd className="text-xl font-bold tabular-nums">
                {has ? won(total.shippingCollected) : EMPTY}
              </dd>
              <dd className="text-[13px] text-[#6b7280]">
                {`구매자가 낸 배송비 · 정산 ${has ? formatNumber(total.settlementCount) : EMPTY}건`}
              </dd>
            </div>
            <div className="px-6 py-4 space-y-1">
              <dt className="text-sm text-[#4b5563]">배송비 환불</dt>
              <dd className="text-xl font-bold tabular-nums text-[#b91c1c]">
                {has ? `${formatMinus(total.shippingRefunded)}원` : EMPTY}
              </dd>
              <dd className="text-[13px] text-[#6b7280]">반품으로 구매자에게 돌려준 배송비</dd>
            </div>
            <div className="px-6 py-4 space-y-1">
              <dt className="text-sm text-[#4b5563]">택배사에 넘길 금액</dt>
              <dd className="text-xl font-bold tabular-nums">
                {has
                  ? won(total.shippingCollected - total.shippingRefunded)
                  : EMPTY}
              </dd>
              <dd className="text-[13px] text-[#6b7280]">배송비 수납 − 배송비 환불</dd>
            </div>
          </dl>
        </section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">일별 내역</h2>
          <button
            type="button"
            className="h-10 px-4 flex items-center gap-1.5 bg-white border border-[#d1d5db] text-sm font-semibold text-[#111827]"
            onClick={onDownloadCsv}
            disabled={!has}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
              />
            </svg>
            CSV 내려받기
          </button>
        </div>
        <table className="w-full bg-white border border-[#e5e7eb] text-sm">
          <thead>
            <tr className="bg-[#f9fafb] text-xs text-[#6b7280]">
              <th className="px-4 pt-2.5" colSpan="2"></th>
              <th
                className="px-4 pt-2.5 text-center font-semibold text-[#0f4c3a] border-b border-[#d1e7dd]"
                colSpan="3"
              >
                순수익
              </th>
              <th
                className="px-4 pt-2.5 text-center font-semibold border-b border-[#e5e7eb]"
                colSpan="2"
              >
                대신 받아 둔 배송비
              </th>
              <th className="px-4 pt-2.5"></th>
            </tr>
            <tr className="bg-[#f9fafb] text-[13px] text-[#4b5563]">
              <th className="px-4 py-3 text-left font-semibold">날짜</th>
              <th className="px-4 py-3 text-left font-semibold">정산 건수</th>
              <th className="px-4 py-3 text-left font-semibold">수수료</th>
              <th className="px-4 py-3 text-left font-semibold">판매자 부담금</th>
              <th className="px-4 py-3 text-left font-semibold text-[#0f4c3a]">순수익</th>
              <th className="px-4 py-3 text-left font-semibold">배송비 수납</th>
              <th className="px-4 py-3 text-left font-semibold">배송비 환불</th>
              <th className="px-4 py-3 text-left font-semibold">총 입금</th>
            </tr>
          </thead>
          <tbody>
            {descending.map((row) => (
              <tr key={row.date} className="border-t border-[#e5e7eb]">
                <td className="px-4 py-3 text-[#111827] tabular-nums whitespace-nowrap">
                  {formatReportDate(row.date).full}
                </td>
                <td className="px-4 py-3 text-left tabular-nums">
                  {formatNumber(row.settlementCount)}
                </td>
                <td className="px-4 py-3 text-left tabular-nums">{formatNumber(row.fee)}</td>
                <td
                  className={`px-4 py-3 text-left tabular-nums ${row.sellerBurden === 0 ? 'text-[#9ca3af]' : ''}`}
                >
                  {formatNumber(row.sellerBurden)}
                </td>
                <td className="px-4 py-3 text-left font-bold tabular-nums text-[#0f4c3a] bg-[#f4f8f6]">
                  {formatNumber(row.netRevenue)}
                </td>
                <td className="px-4 py-3 text-left tabular-nums text-[#4b5563]">
                  {formatNumber(row.shippingCollected)}
                </td>
                <td
                  className={`px-4 py-3 text-left tabular-nums ${
                    row.shippingRefunded === 0 ? 'text-[#9ca3af]' : 'text-[#b91c1c]'
                  }`}
                >
                  {formatMinus(row.shippingRefunded)}
                </td>
                <td className="px-4 py-3 text-left font-semibold tabular-nums">
                  {formatNumber(row.totalDeposit)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-[#d1d5db] bg-[#f9fafb] font-bold">
              <td className="px-4 py-3">합계</td>
              <td className="px-4 py-3 text-left tabular-nums">
                {formatNumber(total.settlementCount)}
              </td>
              <td className="px-4 py-3 text-left tabular-nums">{formatNumber(total.fee)}</td>
              <td className="px-4 py-3 text-left tabular-nums">
                {formatNumber(total.sellerBurden)}
              </td>
              <td className="px-4 py-3 text-left tabular-nums text-[#0f4c3a] bg-[#f4f8f6]">
                {formatNumber(total.netRevenue)}
              </td>
              <td className="px-4 py-3 text-left tabular-nums">
                {formatNumber(total.shippingCollected)}
              </td>
              <td className="px-4 py-3 text-left tabular-nums text-[#b91c1c]">
                {formatMinus(total.shippingRefunded)}
              </td>
              <td className="px-4 py-3 text-left tabular-nums">
                {formatNumber(total.totalDeposit)}
              </td>
            </tr>
          </tbody>
        </table>
        <InfoNote>
          순수익 = 수수료 + 판매자 부담금 · 총 입금 = 순수익 + 배송비 수납 − 배송비 환불 · 금액
          단위: 원
        </InfoNote>
      </div>
    </main>
  );
}

export default AdminFeeReportView;
