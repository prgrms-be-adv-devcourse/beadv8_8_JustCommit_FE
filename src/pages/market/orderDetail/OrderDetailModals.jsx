import Modal from '../../../components/common/Modal';
import ModalButton from '../../../components/common/ModalButton';
import { ActionErrorBar } from '../../../components/common/ActionError';
import { RefreshIcon } from './icons';

// 시안 04-1-2 · 04-1-3 상품 취소 확인 (cancelling: 모달 안 「취소 중…」)
// target = { itemName, refundAmount, shippingFeeNote, warnPickup }
export function CancelModal({ target, cancelling, error, onClose, onConfirm }) {
  const close = cancelling ? undefined : onClose;
  return (
    <Modal
      title="취소할까요?"
      width={440}
      top={160}
      onClose={close}
      footer={
        cancelling ? (
          <>
            <button
              type="button"
              disabled
              className="h-9 w-[88px] bg-white border border-[#e5e7eb] text-[14px] font-medium text-[#9ca3af] cursor-not-allowed"
            >
              닫기
            </button>
            <button
              type="button"
              disabled
              className="h-9 w-[88px] bg-[#f3f4f6] text-[14px] font-medium text-[#9ca3af] cursor-not-allowed"
            >
              취소 중…
            </button>
          </>
        ) : (
          <>
            <ModalButton onClick={onClose}>닫기</ModalButton>
            <ModalButton variant="danger" onClick={onConfirm}>
              취소하기
            </ModalButton>
          </>
        )
      }
    >
      {target.warnPickup && (
        <p className="text-[#4b5563] leading-relaxed">기사님이 수거지 2km 안이면 취소가 거절될 수 있어요.</p>
      )}
      <dl className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
        <div className="px-4 py-3 flex justify-between">
          <dt className="text-[#6b7280]">취소할 상품</dt>
          <dd className="text-[#111827] font-medium">{target.itemName}</dd>
        </div>
        <div className="px-4 py-3 flex justify-between">
          <dt className="text-[#6b7280]">환불 금액 (예치금)</dt>
          <dd className="text-[#111827] font-bold tabular-nums">{target.refundAmount}</dd>
        </div>
      </dl>
      {target.shippingFeeNote && <p className="text-[13px] text-[#6b7280]">{target.shippingFeeNote}</p>}
      <ActionErrorBar message={error} />
    </Modal>
  );
}

// 시안 03-5-3 주문 전체 취소 확인 (cancelling: 모달 안 「취소 중…」)
// target = { itemCount, summary, refundAmount, shippingFeeNote }
export function CancelAllModal({ target, cancelling, error, onClose, onConfirm }) {
  const close = cancelling ? undefined : onClose;
  return (
    <Modal
      title="주문을 모두 취소할까요?"
      width={440}
      top={160}
      onClose={close}
      footer={
        cancelling ? (
          <>
            <button
              type="button"
              disabled
              className="h-9 w-[88px] bg-white border border-[#e5e7eb] text-[14px] font-medium text-[#9ca3af] cursor-not-allowed"
            >
              닫기
            </button>
            <button
              type="button"
              disabled
              className="h-9 w-[88px] bg-[#f3f4f6] text-[14px] font-medium text-[#9ca3af] cursor-not-allowed"
            >
              취소 중…
            </button>
          </>
        ) : (
          <>
            <ModalButton onClick={onClose}>닫기</ModalButton>
            <ModalButton variant="danger" onClick={onConfirm}>
              취소하기
            </ModalButton>
          </>
        )
      }
    >
      <p className="text-[#4b5563] leading-relaxed">{`이 주문의 상품 ${target.itemCount}개를 모두 취소하고 예치금으로 환불해요.`}</p>
      <dl className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
        <div className="px-4 py-3 flex justify-between">
          <dt className="text-[#6b7280]">취소할 상품</dt>
          <dd className="text-[#111827] font-medium">{target.summary}</dd>
        </div>
        <div className="px-4 py-3 flex justify-between">
          <dt className="text-[#6b7280]">환불 금액 (예치금)</dt>
          <dd className="text-[#111827] font-bold tabular-nums">{target.refundAmount}</dd>
        </div>
      </dl>
      <p className="text-[13px] text-[#6b7280]">{target.shippingFeeNote}</p>
      <ActionErrorBar message={error} />
    </Modal>
  );
}

// 시안 03-5-5 구매 확정 확인 (모달의 「구매 확정」을 눌러야 확정)
// target = { itemName, price, autoConfirmNote }
export function ConfirmModal({ target, confirming, error, onClose, onConfirm }) {
  return (
    <Modal
      title="구매를 확정할까요?"
      width={440}
      top={160}
      onClose={confirming ? undefined : onClose}
      footer={
        <>
          <ModalButton onClick={onClose} disabled={confirming}>
            닫기
          </ModalButton>
          <ModalButton variant="primary" onClick={onConfirm} disabled={confirming}>
            구매 확정
          </ModalButton>
        </>
      }
    >
      <p className="text-[#4b5563] leading-relaxed">구매를 확정하면 판매자에게 정산되고, 취소하거나 반품할 수 없어요.</p>
      <dl className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
        <div className="px-4 py-3 flex justify-between">
          <dt className="text-[#6b7280]">확정할 상품</dt>
          <dd className="text-[#111827] font-medium">{target.itemName}</dd>
        </div>
        <div className="px-4 py-3 flex justify-between">
          <dt className="text-[#6b7280]">상품 금액</dt>
          <dd className="text-[#111827] font-bold tabular-nums">{target.price}</dd>
        </div>
      </dl>
      <p className="text-[13px] text-[#6b7280]">{target.autoConfirmNote}</p>
      <ActionErrorBar message={error} />
    </Modal>
  );
}

// 시안 03-5-4 배송 조회 모달
// tracking = { sellerName, invoiceNo, events: [{ time, status, location }] } — 첫 줄이 최신
export function TrackingModal({ tracking, refreshCooldown, onRefresh, onCopy, onClose }) {
  return (
    <Modal
      title={
        <>
          배송 조회 <span className="text-sm font-normal text-[#6b7280]">{`· ${tracking.sellerName}`}</span>
        </>
      }
      width={520}
      top={160}
      onClose={onClose}
      footer={
        <ModalButton variant="primary" onClick={onClose}>
          닫기
        </ModalButton>
      }
    >
      <div className="px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] flex items-center gap-3">
        <span className="text-[13px] text-[#6b7280]">송장번호</span>
        <span className="font-bold text-[#111827] tabular-nums">{tracking.invoiceNo}</span>
        <button
          type="button"
          className="h-8 px-3 bg-white border border-[#d1d5db] text-xs font-semibold text-[#111827]"
          onClick={onCopy}
        >
          복사
        </button>
        <button
          type="button"
          disabled={refreshCooldown > 0}
          className="ml-auto h-8 px-3 flex items-center gap-1 bg-white border border-[#d1d5db] text-xs font-semibold text-[#111827]"
          onClick={onRefresh}
        >
          <RefreshIcon />
          {refreshCooldown > 0 ? `${refreshCooldown}초 뒤 새로고침` : '새로고침'}
        </button>
      </div>
      <ol className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
        {tracking.events.map((event, index) => (
          <li
            key={`${event.time}-${event.status}`}
            className={`px-4 py-3 flex items-center gap-4${index === 0 ? ' bg-[#f4f8f6]' : ''}`}
          >
            <span className="w-[88px] text-[13px] text-[#6b7280] tabular-nums shrink-0">{event.time}</span>
            <span className={index === 0 ? 'flex-1 font-bold text-[#0f4c3a]' : 'flex-1 text-[#111827]'}>
              {event.status}
            </span>
            <span className="text-[13px] text-[#4b5563]">{event.location}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-[#6b7280]">조회한 순간 기준이에요. 새로고침은 10초에 한 번 할 수 있어요.</p>
    </Modal>
  );
}
