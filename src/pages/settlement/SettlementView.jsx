import { Link } from 'react-router-dom';
import { InfoNote, PageBackLink } from '../../components/seller/SellerParts';

// 상품 이름 (반품 · 취소 배지가 있으면 앞에 붙음)
export function SettlementProductName({ row }) {
  if (!row.badge) return <span className="text-[#111827]">{row.productName}</span>;
  return (
    <span className="flex items-center gap-2">
      <span className={`h-6 px-2 inline-flex items-center text-xs font-semibold shrink-0 ${row.badge.tone}`}>{row.badge.text}</span>
      <span className="text-[#111827]">{row.productName}</span>
    </span>
  );
}

// 요약 카드 (green: 초록 강조 카드)
export function SummaryCard({ label, value, sub, green = false }) {
  if (green) {
    return (
      <div className="p-6 bg-[#0f4c3a] text-white space-y-1">
        <p className="text-sm text-white/80">{label}</p>
        <p className="text-[26px] font-black tabular-nums tracking-tight">{value}</p>
        {sub && <p className="text-[13px] text-white/80">{sub}</p>}
      </div>
    );
  }
  return (
    <div className="p-6 bg-white border border-[#e5e7eb] text-[#111827] space-y-1">
      <p className="text-sm text-[#6b7280]">{label}</p>
      <p className="text-[26px] font-black tabular-nums tracking-tight">{value}</p>
      {sub && <p className="text-[13px] text-[#6b7280]">{sub}</p>}
    </div>
  );
}

// 시안 08-6-1 정산 (화면만, 데이터는 props)
// summary = { pendingText, monthPaidText, monthSinceText, withdrawableText } / rows: settlementRows.toSettlementRow
function SettlementView({ summary, rows }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[1160px] mx-auto space-y-6">
        <PageBackLink to="/mypage" label="마이페이지" />
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">정산</h1>
          <Link
            to="/settlements/report"
            className="h-10 w-[120px] flex items-center justify-center bg-white border border-[#0f4c3a] text-sm font-semibold text-[#0f4c3a]"
          >
            정산 리포트
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard green label="지급 대기" value={summary.pendingText} sub="구매 확정돼 곧 들어올 정산금" />
          <SummaryCard label="이번 달 지급 완료" value={summary.monthPaidText} sub={summary.monthSinceText} />
          <SummaryCard label="인출 가능 금액" value={summary.withdrawableText} sub="예치금에서 계좌로 인출할 수 있어요" />
        </div>
        <h2 className="pt-2 text-lg font-bold text-[#111827]">정산 내역</h2>
        {rows.length > 0 ? (
          <table className="w-full bg-white border border-[#e5e7eb] text-sm">
            <thead>
              <tr className="bg-[#f9fafb] text-[13px] text-[#4b5563] text-left">
                <th className="px-5 py-3 font-semibold">정산일</th>
                <th className="px-5 py-3 font-semibold">상품 · 주문번호</th>
                <th className="px-5 py-3 font-semibold text-right">판매 금액</th>
                <th className="px-5 py-3 font-semibold text-right">수수료 (5%)</th>
                <th className="px-5 py-3 font-semibold text-right">판매자 부담금</th>
                <th className="px-5 py-3 font-semibold text-right">정산 금액</th>
                <th className="px-5 py-3 font-semibold">상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={`border-t border-[#e5e7eb]${row.rowTone ? ` ${row.rowTone}` : ''}`}>
                  <td className="px-5 py-4 text-[#4b5563] tabular-nums">{row.dateText}</td>
                  <td className="px-5 py-4">
                    <p>
                      <SettlementProductName row={row} />
                    </p>
                    <p className="text-xs text-[#6b7280] tabular-nums">{row.orderNo}</p>
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums text-[#111827]">{row.saleText}</td>
                  <td className="px-5 py-4 text-right tabular-nums text-[#4b5563]">{row.feeText}</td>
                  <td className="px-5 py-4 text-right tabular-nums text-[#4b5563]">{row.burdenText}</td>
                  <td className="px-5 py-4 text-right font-bold tabular-nums text-[#111827]">{row.payoutText}</td>
                  <td className="px-5 py-4">
                    <span className={`h-7 px-2.5 inline-flex items-center text-xs font-semibold ${row.status.tone}`}>
                      {row.status.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="bg-white border border-[#e5e7eb] px-6 py-20 flex flex-col items-center text-center gap-3">
            <h2 className="text-xl font-bold text-[#111827]">아직 정산된 내역이 없어요</h2>
            <p className="text-[15px] text-[#4b5563]">구매 확정된 판매 건이 정산되면 여기에 쌓여요.</p>
          </div>
        )}
        <InfoNote>
          구매 확정되면 정산이 만들어지고, 정산 금액은 예치금의 인출 가능 금액으로 들어가요. 지급에 실패하면 자동으로 다시
          시도해요.
        </InfoNote>
        <InfoNote>
          수수료는 판매 금액의 5%예요(배송비 제외, 원 단위 미만 버림). 반품이 있으면 판매자 부담금(반품 배송비)이 빠지고,
          정산 금액이 0원보다 작으면 다음 정산금 · 충전금에서 먼저 빠져요.
        </InfoNote>
      </div>
    </main>
  );
}

export default SettlementView;
