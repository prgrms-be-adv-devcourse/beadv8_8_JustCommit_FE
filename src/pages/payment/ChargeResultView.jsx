import { Link } from 'react-router-dom';
import { ActionErrorLine } from '../../components/common/ActionError';
import { won } from './chargeUtils';

// 시안 07-2-3 충전 완료
// errorMessage: 주문서에서 온 충전에서 충전은 됐지만 주문 결제에 실패했을 때 (시안 없음, 버튼 아래 한 줄)
export function ChargeSuccessView({ amount, balanceAfter, errorMessage }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 py-16 flex justify-center">
      <section className="w-full max-w-[480px] bg-white border border-[#e5e7eb] p-10 flex flex-col items-center text-center gap-7">
        <div className="w-16 h-16 bg-[#f4f8f6] border border-[#d1e7dd] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#0f4c3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">충전이 완료됐어요</h1>
        <dl className="w-full border border-[#e5e7eb] divide-y divide-[#e5e7eb] text-sm text-left">
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <dt className="text-[#6b7280]">충전 금액</dt>
            <dd className="font-semibold text-[#111827]">{won(amount)}</dd>
          </div>
          <div className="px-5 py-4 flex items-baseline justify-between gap-4">
            <dt className="text-[#6b7280]">현재 예치금</dt>
            <dd className="text-xl font-black text-[#0f4c3a] tracking-tight">{won(balanceAfter)}</dd>
          </div>
        </dl>
        <Link
          to="/wallet"
          className="w-full h-12 flex items-center justify-center bg-[#0f4c3a] text-white text-[15px] font-bold"
        >
          예치금 보기
        </Link>
        {errorMessage && <ActionErrorLine message={errorMessage} className="-mt-5" />}
      </section>
    </main>
  );
}

// 시안 07-2-4 충전 실패 (토스 결제창 실패 · 취소, 승인 실패 모두)
// retryTo: 다시 충전하기 경로 (주문서에서 온 충전이면 그 주문으로)
export function ChargeFailView({ retryTo = '/deposit/charge' }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 py-16 flex justify-center items-start">
      <section className="w-full max-w-[480px] bg-white border border-[#e5e7eb] p-10 flex flex-col items-center text-center gap-6">
        <span className="w-16 h-16 flex items-center justify-center bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c]">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">충전하지 못했어요</h1>
          <p className="text-[15px] text-[#4b5563] leading-relaxed">결제가 취소됐거나 실패했어요. 예치금은 바뀌지 않았어요.</p>
        </div>
        <div className="w-full flex gap-2">
          <Link
            to="/wallet"
            className="flex-1 h-12 flex items-center justify-center bg-white border border-[#d1d5db] text-[15px] font-semibold text-[#111827]"
          >
            예치금으로
          </Link>
          <Link
            to={retryTo}
            className="flex-1 h-12 flex items-center justify-center bg-[#0f4c3a] text-white text-[15px] font-semibold"
          >
            다시 충전하기
          </Link>
        </div>
      </section>
    </main>
  );
}

// 승인 처리 중 (시안 없음: 충전 완료 카드 자리에 안내 한 줄)
export function ChargeProcessingView() {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 py-16 flex justify-center">
      <section className="w-full max-w-[480px] bg-white border border-[#e5e7eb] p-10 flex flex-col items-center text-center gap-7">
        <p className="text-[15px] text-[#4b5563] leading-relaxed">충전을 마무리하는 중이에요. 잠시만 기다려 주세요.</p>
      </section>
    </main>
  );
}
