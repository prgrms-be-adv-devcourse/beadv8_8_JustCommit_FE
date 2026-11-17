import { ActionErrorLine } from '../../components/common/ActionError';
import InfoNote from '../../components/wallet/InfoNote';
import { won } from './chargeUtils';

const QUICK_AMOUNTS = [
  { value: 10000, label: '+1만' },
  { value: 50000, label: '+5만' },
  { value: 100000, label: '+10만' },
];

// 시안 07-2-1 충전 · 07-2-2 주문서에서 넘어온 충전
// order: 주문서에서 왔을 때 { totalAmount, remaining('08:15') }, 아니면 null
// amountError: 금액 입력 안내 (10,000원 단위가 아닐 때 등)
function ChargeView({
  balance,
  amount,
  onAmountChange,
  onAdd,
  onClear,
  disabled,
  canPay,
  onPay,
  payLabel,
  amountError,
  errorMessage,
  order,
}) {
  const hasBalance = typeof balance === 'number';
  const afterCharge = hasBalance ? balance + amount : '-';

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 py-14 flex justify-center">
      <section className="w-full max-w-[480px] bg-white border border-[#e5e7eb] p-9 space-y-6">
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">예치금 충전</h1>
        {order && (
          <div className="px-5 py-4 bg-[#fef2f2] border border-[#fecaca] flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#b91c1c]">결제 대기 중인 주문이 있어요</p>
              <p className="mt-1 text-[13px] text-[#4b5563] leading-relaxed">
                주문한 시각부터 10분 안에 충전하고 결제하지 않으면 주문이 취소되고 상품이 다시 판매돼요.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-[#6b7280]">남은 시간</p>
              <p className="text-2xl font-black text-[#dc2626] tabular-nums tracking-tight">{order.remaining}</p>
            </div>
          </div>
        )}
        <dl className="border border-[#e5e7eb] divide-y divide-[#e5e7eb] text-sm">
          {order && (
            <div className="px-4 py-3 flex justify-between">
              <dt className="text-[#6b7280]">결제할 금액</dt>
              <dd className="font-semibold text-[#111827]">{won(order.totalAmount)}</dd>
            </div>
          )}
          <div className="px-4 py-3 flex justify-between">
            <dt className="text-[#6b7280]">현재 예치금</dt>
            <dd className="font-semibold text-[#111827]">{hasBalance ? won(balance) : '-'}</dd>
          </div>
          {order && (
            <div className="px-4 py-3 flex justify-between">
              <dt className="text-[#6b7280]">부족한 금액</dt>
              <dd className="font-bold text-[#dc2626]">
                {hasBalance ? won(Math.max(order.totalAmount - balance, 0)) : '-'}
              </dd>
            </div>
          )}
        </dl>
        <div className="space-y-2.5">
          <label htmlFor="charge-amount" className="block text-sm font-bold text-[#111827]">
            충전 금액
          </label>
          <div
            className={`h-14 px-4 border ${amountError ? 'border-[#b91c1c]' : 'border-[#0f4c3a]'} flex items-center gap-2`}
          >
            <input
              id="charge-amount"
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
          <div className="flex items-center gap-2">
            {QUICK_AMOUNTS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onAdd(item.value)}
                disabled={disabled}
                className="h-9 px-4 bg-white border border-[#d1d5db] text-sm font-medium text-[#111827] hover:bg-[#f9fafb]"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="h-9 px-2 text-[13px] text-[#6b7280] underline"
            >
              지우기
            </button>
          </div>
          {amountError && (
            <p role="alert" className="flex items-center gap-1.5 text-[13px] font-medium text-[#b91c1c]">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {amountError}
            </p>
          )}
          <p className="text-xs text-[#6b7280]">
            {order
              ? '부족한 금액을 10,000원 단위로 올려서 채웠어요. (최소 10,000원)'
              : '10,000원 단위로 충전할 수 있어요. (최소 10,000원)'}
          </p>
        </div>
        {order ? (
          <dl className="px-4 py-1 bg-[#f4f8f6] border border-[#d1e7dd] divide-y divide-[#d1e7dd] text-sm">
            <div className="py-3 flex justify-between">
              <dt className="text-[#0f4c3a]">충전 후 예치금</dt>
              <dd className="font-semibold text-[#0f4c3a]">{won(afterCharge)}</dd>
            </div>
            <div className="py-3 flex justify-between items-baseline">
              <dt className="text-[#0f4c3a]">결제 후 잔액</dt>
              <dd className="text-xl font-black text-[#0f4c3a] tracking-tight">
                {hasBalance ? won(afterCharge - order.totalAmount) : '-'}
              </dd>
            </div>
          </dl>
        ) : (
          <div className="px-4 py-4 bg-[#f4f8f6] border border-[#d1e7dd] flex justify-between items-baseline">
            <span className="text-sm text-[#0f4c3a]">충전 후 예치금</span>
            <span className="text-xl font-black text-[#0f4c3a] tracking-tight">{won(afterCharge)}</span>
          </div>
        )}
        <InfoNote>
          {order
            ? '결제하기를 누르면 토스페이먼츠 결제창이 열려요. 충전이 끝나면 이 주문을 바로 결제해요.'
            : '결제하기를 누르면 토스페이먼츠 결제창이 열려요.'}
        </InfoNote>
        <div>
          <button
            type="button"
            disabled={!canPay}
            onClick={onPay}
            className={
              canPay
                ? 'w-full h-14 bg-[#0f4c3a] text-white text-base font-bold'
                : 'w-full h-14 bg-[#f3f4f6] text-[#9ca3af] text-base font-bold cursor-not-allowed'
            }
          >
            {payLabel}
          </button>
          <ActionErrorLine message={errorMessage} />
        </div>
      </section>
    </main>
  );
}

export default ChargeView;
