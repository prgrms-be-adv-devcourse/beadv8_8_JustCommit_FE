import { ActionErrorBar } from '../../components/common/ActionError';
import Modal from '../../components/common/Modal';
import ModalButton from '../../components/common/ModalButton';
import InfoNote from '../../components/wallet/InfoNote';
import WalletBackLink from '../../components/wallet/WalletBackLink';
import { won } from './chargeUtils';

const BADGE_DONE = 'h-7 px-2.5 inline-flex items-center text-xs font-semibold bg-[#f4f8f6] border border-[#d1e7dd] text-[#0f4c3a]';
const BADGE_GRAY = 'h-7 px-2.5 inline-flex items-center text-xs font-semibold bg-[#e5e7eb] text-[#4b5563]';

// 충전 상태 → 배지 (시안에는 충전 완료 · 충전 취소 완료만 있음, 나머지는 회색으로)
function statusBadge(charge) {
  if (charge.status === 'PENDING') return { label: '충전 처리 중', className: BADGE_GRAY };
  if (charge.status === 'CANCEL_PENDING') return { label: '취소 처리 중', className: BADGE_GRAY };
  if (charge.status === 'REVIEW_REQUIRED') return { label: '확인 중', className: BADGE_GRAY };
  if (charge.cancelledAmount > 0) return { label: '충전 취소 완료', className: BADGE_GRAY };
  return { label: '충전 완료', className: BADGE_DONE };
}

// 이 충전 건에서 지금 취소할 수 있는지 (자리 문구 문자열이면 버튼을 보여 줌)
function canCancel(charge) {
  if (charge.status !== 'APPROVED') return false;
  return typeof charge.cancelableAmount === 'number' ? charge.cancelableAmount > 0 : Boolean(charge.cancelableAmount);
}

// 시안 07-3-1 충전 내역 · 07-3-2 취소 확인 모달 · 07-3-3 취소 완료 모달 · 07-3-4 취소 후 목록
// charges: [{ chargeId, approvedAt('2026.10.15 14:20'), amount, cancelledAmount, cancelableAmount, status }]
// confirmTarget: { amount, usedAmount, cancelAmount } — 취소 확인 모달
// doneResult: { usedAmount, cancelAmount, balanceAfter } — 취소 완료 모달
function ChargeHistoryView({
  cancelableTotal,
  charges,
  onCancelClick,
  confirmTarget,
  onConfirm,
  onCloseConfirm,
  isCancelling,
  cancelError,
  doneResult,
  onCloseDone,
}) {
  return (
    <>
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
        <div className="max-w-[960px] mx-auto space-y-6">
          <WalletBackLink />
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">충전 내역</h1>
          </div>
          <div className="px-5 py-4 bg-[#f9fafb] border border-[#e5e7eb] flex items-center justify-between">
            <span className="text-sm text-[#4b5563]">취소할 수 있는 충전금</span>
            <span className="text-lg font-bold text-[#111827] tabular-nums">{won(cancelableTotal)}</span>
          </div>
          <table className="w-full bg-white border border-[#e5e7eb] text-sm">
            <thead>
              <tr className="bg-[#f9fafb] text-[13px] text-[#4b5563] text-left">
                <th className="px-6 py-3 font-semibold">충전일</th>
                <th className="px-6 py-3 font-semibold text-right">금액</th>
                <th className="px-6 py-3 font-semibold">상태</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {charges.map((charge) => {
                const badge = statusBadge(charge);
                const isCancelled = charge.cancelledAmount > 0;
                const isPartly = isCancelled && charge.cancelledAmount < charge.amount;
                return (
                  <tr key={charge.chargeId} className="border-t border-[#e5e7eb]">
                    <td className="px-6 py-4 text-[#4b5563] tabular-nums">{charge.approvedAt}</td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-base font-bold tabular-nums ${isCancelled ? 'text-[#6b7280]' : 'text-[#111827]'}`}
                      >
                        {won(charge.amount)}
                      </span>
                      {isPartly && (
                        <span className="block mt-0.5 text-xs text-[#6b7280]">
                          {`${won(charge.cancelledAmount)} 취소 · ${won(charge.amount - charge.cancelledAmount)} 사용`}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={badge.className}>{badge.label}</span>
                    </td>
                    <td className="px-6 py-3 text-right w-[128px]">
                      {canCancel(charge) && (
                        <button
                          type="button"
                          onClick={() => onCancelClick(charge)}
                          className="h-9 w-[88px] bg-white border border-[#d1d5db] text-sm font-semibold text-[#b91c1c]"
                        >
                          충전 취소
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <InfoNote>
            충전 취소는 남은 충전금 안에서 원래 결제수단으로 돌려받아요. 이미 결제에 쓴 금액은 빼고 취소돼요.
          </InfoNote>
        </div>
      </main>

      {confirmTarget && (
        <Modal
          title={`${won(confirmTarget.amount)} 충전을 취소할까요?`}
          width={460}
          onClose={onCloseConfirm}
          footer={
            <>
              <ModalButton onClick={onCloseConfirm} disabled={isCancelling}>
                닫기
              </ModalButton>
              <ModalButton variant="danger" fit onClick={onConfirm} disabled={isCancelling}>
                {`${won(confirmTarget.cancelAmount)} 취소`}
              </ModalButton>
            </>
          }
        >
          <p className="text-[#4b5563] leading-relaxed">
            {`이미 사용한 ${won(confirmTarget.usedAmount)}을 뺀 `}
            <b className="text-[#111827]">{won(confirmTarget.cancelAmount)}</b>
            만 토스페이먼츠에서 부분 취소되고 충전금에서 빠져요.
          </p>
          <dl className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
            <div className="px-4 py-3 flex justify-between">
              <dt className="text-[#6b7280]">충전 금액</dt>
              <dd className="font-semibold text-[#111827] tabular-nums">{won(confirmTarget.amount)}</dd>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <dt className="text-[#6b7280]">이미 사용한 금액</dt>
              <dd className="font-semibold text-[#111827] tabular-nums">{won(confirmTarget.usedAmount)}</dd>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <dt className="text-[#6b7280]">취소되는 금액</dt>
              <dd className="font-bold text-[#b91c1c] tabular-nums">{won(confirmTarget.cancelAmount)}</dd>
            </div>
          </dl>
          <ActionErrorBar message={cancelError} />
        </Modal>
      )}

      {doneResult && (
        <Modal
          title="충전 취소가 완료됐어요"
          width={460}
          onClose={onCloseDone}
          footer={
            <ModalButton variant="primary" onClick={onCloseDone}>
              확인
            </ModalButton>
          }
        >
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 flex items-center justify-center bg-[#f4f8f6] border border-[#d1e7dd] text-[#0f4c3a] shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p className="text-[#4b5563] leading-relaxed">
              {`이미 사용한 ${won(doneResult.usedAmount)}을 뺀 `}
              <b className="text-[#111827]">{won(doneResult.cancelAmount)}</b>이 토스페이먼츠로 환불되고 충전금에서
              빠졌어요.
            </p>
          </div>
          <dl className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
            <div className="px-4 py-3 flex justify-between">
              <dt className="text-[#6b7280]">남은 예치금</dt>
              <dd className="font-bold text-[#111827] tabular-nums">{won(doneResult.balanceAfter)}</dd>
            </div>
          </dl>
        </Modal>
      )}
    </>
  );
}

export default ChargeHistoryView;
