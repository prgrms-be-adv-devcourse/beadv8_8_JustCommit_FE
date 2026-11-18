import { Link } from 'react-router-dom';
import { ActionErrorLine } from '../../components/common/ActionError';
import InfoNote from '../../components/common/InfoNote';
import { won } from './chargeUtils';

// 시안 07-4-1 인출 · 07-4-2 인출 금액 초과
// account: "KB국민은행 ***4567 · 예금주 김*식" 형태 한 줄 (예금주는 응답 값 그대로)
// isOver: 인출 가능 금액을 넘었을 때 (빨간 테두리 · 안내 · 신청 버튼 비활성)
function WithdrawView({
  balance,
  chargeBalance,
  withdrawableBalance,
  account,
  amount,
  onAmountChange,
  onAll,
  isOver,
  canSubmit,
  onSubmit,
  submitLabel,
  disabled,
  errorMessage,
}) {
  let after = '—';
  if (!isOver && typeof withdrawableBalance === 'number') after = won(withdrawableBalance - amount);
  else if (!isOver) after = '{인출 후 인출 가능 금액}';

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 py-14 flex justify-center items-start">
      <section className="w-full max-w-[480px] bg-white border border-[#e5e7eb] p-9 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">예치금 인출</h1>
          <Link to="/wallet/withdrawals" className="text-sm font-semibold text-[#0f4c3a] underline">
            인출 내역
          </Link>
        </div>
        <dl className="border border-[#e5e7eb] divide-y divide-[#e5e7eb] text-sm">
          <div className="px-4 py-3 flex justify-between">
            <dt className="text-[#6b7280]">보유 예치금</dt>
            <dd className="font-semibold text-[#111827] tabular-nums">{balance === null ? '-' : won(balance)}</dd>
          </div>
          <div className="px-4 py-3 flex justify-between">
            <dt className="text-[#6b7280]">
              충전금 <span className="text-xs">(인출 안 됨)</span>
            </dt>
            <dd className="text-[#6b7280] tabular-nums">{won(chargeBalance)}</dd>
          </div>
          <div className="px-4 py-3 flex justify-between items-baseline bg-[#f4f8f6]">
            <dt className="font-semibold text-[#0f4c3a]">인출 가능 금액</dt>
            <dd className="text-xl font-black text-[#0f4c3a] tabular-nums tracking-tight">{won(withdrawableBalance)}</dd>
          </div>
        </dl>
        <div className="space-y-2">
          <span className="text-sm font-bold text-[#111827]">받는 계좌</span>
          <div className="h-12 px-4 flex items-center justify-between bg-[#f3f4f6] border border-[#e5e7eb] text-[15px] text-[#111827] tabular-nums">
            <span>{account}</span>
            {/* TODO: 계좌 변경 화면(member 「계좌 변경」 API 추가 예정)이 생기면 그 경로로 */}
            <Link to="/mypage/account/bank" className="text-[13px] font-semibold text-[#0f4c3a] underline">
              계좌 변경
            </Link>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="withdraw-amount" className="text-sm font-bold text-[#111827]">
            인출 금액
          </label>
          <div className="flex gap-2">
            <div
              className={`flex-1 min-w-0 h-14 px-4 border ${isOver ? 'border-[#b91c1c]' : 'border-[#0f4c3a]'} flex items-center gap-2`}
            >
              <input
                id="withdraw-amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount ? amount.toLocaleString('ko-KR') : ''}
                onChange={(event) => onAmountChange(event.target.value)}
                disabled={disabled}
                className="flex-1 min-w-0 border-0 p-0 focus:ring-0 text-right text-2xl font-black text-[#111827] tracking-tight bg-transparent"
              />
              <span className="text-base font-semibold text-[#4b5563]">원</span>
            </div>
            <button
              type="button"
              onClick={onAll}
              disabled={disabled}
              className="h-14 w-[88px] bg-white border border-[#d1d5db] text-sm font-semibold text-[#111827] shrink-0"
            >
              전액
            </button>
          </div>
          {isOver && (
            <p role="alert" className="flex items-center gap-1.5 text-[13px] font-medium text-[#b91c1c]">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {`인출 가능 금액 ${won(withdrawableBalance)}을 넘었어요`}
            </p>
          )}
        </div>
        <div className="px-4 py-4 bg-[#f4f8f6] border border-[#d1e7dd] flex justify-between items-baseline">
          <span className="text-sm text-[#0f4c3a]">인출 후 인출 가능 금액</span>
          <span className="text-xl font-black text-[#0f4c3a] tabular-nums tracking-tight">{after}</span>
        </div>
        <InfoNote>충전금은 계좌로 인출할 수 없어요. 충전 내역에서 충전 취소로 돌려받아 주세요.</InfoNote>
        <InfoNote>신청하면 바로 인출 가능 금액에서 빠지고, 이체에 실패하면 다시 돌려 드려요.</InfoNote>
        <div>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className={
              canSubmit
                ? 'w-full h-14 bg-[#0f4c3a] text-white text-base font-bold'
                : 'w-full h-14 bg-[#f3f4f6] text-[#9ca3af] text-base font-bold cursor-not-allowed'
            }
          >
            {submitLabel}
          </button>
          <ActionErrorLine message={errorMessage} />
        </div>
      </section>
    </main>
  );
}

export default WithdrawView;
