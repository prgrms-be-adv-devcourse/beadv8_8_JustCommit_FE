import { Link } from 'react-router-dom';
import { won } from './chargeUtils';

// 시안 07-1-1 예치금 · 07-1-2 예치금 빈 상태
// rows: [{ id, date, badge, description, amount, isIn }] (이미 탭으로 거른 목록)
// listState: loading | error | done
function WalletView({ balance, chargeBalance, withdrawableBalance, tabs, tab, onTabChange, rows, listState }) {
  const renderList = () => {
    if (listState !== 'done' || rows.length === 0) {
      let title = '아직 거래 내역이 없어요';
      let text = '예치금을 충전하면 여기에 내역이 쌓여요.';
      if (listState === 'loading') {
        title = '거래 내역을 불러오는 중이에요';
        text = '잠시만 기다려 주세요.';
      } else if (listState === 'error') {
        title = '거래 내역을 불러오지 못했어요';
        text = '잠시 후 다시 시도해 주세요.';
      }
      return (
        <div className="bg-white border border-[#e5e7eb] px-6 py-20 flex flex-col items-center text-center gap-3">
          <h2 className="text-xl font-bold text-[#111827]">{title}</h2>
          <p className="text-[15px] text-[#4b5563]">{text}</p>
        </div>
      );
    }

    return (
      <ul className="bg-white border border-[#e5e7eb]">
        {rows.map((row) => (
          <li key={row.id} className="px-6 py-4 flex items-center gap-5 border-t border-[#e5e7eb] first:border-t-0">
            <span className="w-[92px] text-[13px] text-[#6b7280] tabular-nums shrink-0">{row.date}</span>
            <span className="h-6 w-[64px] flex items-center justify-center bg-[#f3f4f6] text-xs font-semibold text-[#4b5563] shrink-0">
              {row.badge}
            </span>
            <span className="flex-1 min-w-0 text-[15px] text-[#111827] truncate">{row.description}</span>
            <span
              className={`text-base font-bold tabular-nums ${row.isIn ? 'text-[#0f4c3a]' : 'text-[#111827]'}`}
            >{`${row.isIn ? '+' : '−'}${won(row.amount)}`}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-8 pb-16">
      <div className="max-w-[960px] mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">예치금</h1>
        <section className="bg-white border border-[#e5e7eb]">
          <div className="p-8 flex items-end justify-between gap-6">
            <div className="space-y-1">
              <p className="text-sm text-[#4b5563]">보유 예치금</p>
              <p className="text-[40px] leading-tight font-black text-[#111827] tabular-nums tracking-tight">
                {balance === null ? '-' : won(balance)}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/deposit/charge"
                className="h-12 w-[120px] flex items-center justify-center bg-[#0f4c3a] text-white text-[15px] font-semibold"
              >
                충전하기
              </Link>
              <Link
                to="/wallet/withdraw"
                className="h-12 w-[120px] flex items-center justify-center bg-white border border-[#d1d5db] text-[15px] font-semibold text-[#111827]"
              >
                인출하기
              </Link>
            </div>
          </div>
          <dl className="grid grid-cols-2 border-t border-[#e5e7eb] divide-x divide-[#e5e7eb]">
            <div className="px-8 py-5 space-y-1">
              <dt className="text-sm font-semibold text-[#111827]">
                충전금 <span className="font-normal text-[#6b7280]">· 토스로 충전한 돈</span>
              </dt>
              <dd className="text-xl font-bold text-[#111827] tabular-nums">{won(chargeBalance)}</dd>
              <dd className="text-[13px] text-[#6b7280]">
                결제에 쓰고, 남은 금액은 충전 취소로 돌려받아요 ·{' '}
                <Link to="/wallet/charges" className="font-semibold text-[#0f4c3a] underline">
                  충전 내역
                </Link>
              </dd>
            </div>
            <div className="px-8 py-5 space-y-1">
              <dt className="text-sm font-semibold text-[#111827]">
                인출 가능 금액 <span className="font-normal text-[#6b7280]">· 판매 정산금</span>
              </dt>
              <dd className="text-xl font-bold text-[#111827] tabular-nums">{won(withdrawableBalance)}</dd>
              <dd className="text-[13px] text-[#6b7280]">
                결제에 쓰거나 계좌로 인출할 수 있어요 ·{' '}
                <Link to="/wallet/withdrawals" className="font-semibold text-[#0f4c3a] underline">
                  인출 내역
                </Link>
              </dd>
            </div>
          </dl>
        </section>
        <h2 className="pt-2 text-lg font-bold text-[#111827]">거래 내역</h2>
        <div role="tablist" aria-label="거래 종류" className="flex border-b border-[#e5e7eb]">
          {tabs.map((item) => {
            const isSelected = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onTabChange(item.key)}
                className={`h-11 px-4 -mb-px border-b-2 text-[15px] ${
                  isSelected
                    ? 'border-[#0f4c3a] text-[#0f4c3a] font-bold'
                    : 'border-transparent text-[#6b7280] font-medium'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        {renderList()}
      </div>
    </main>
  );
}

export default WalletView;
