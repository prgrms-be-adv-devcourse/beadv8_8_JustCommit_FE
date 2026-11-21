import { Link } from 'react-router-dom';
import ReturnTimeline from '../../components/order/ReturnTimeline';
import { ActionErrorBar, ActionErrorLine } from '../../components/common/ActionError';
import Modal from '../../components/common/Modal';
import ModalButton from '../../components/common/ModalButton';
import PageBackLink from '../../components/common/PageBackLink';
import { SALES_SHIPMENT_STEPS } from '../../constants/seller';

const BANNER_BADGE =
  'h-7 px-2.5 flex items-center border text-[13px] font-semibold shrink-0 bg-[#fffbeb] border-[#fde68a] text-[#92400e]';

function CheckIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// 흰 카드 머리 (제목 + 오른쪽 내용)
function CardHead({ title, children }) {
  return (
    <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center gap-3">
      <h2 className="text-lg font-bold text-[#111827]">{title}</h2>
      <span className="ml-auto">{children}</span>
    </div>
  );
}

// 노란 안내 카드 머리 (제목 · 설명 · 배지)
function BannerHead({ title, desc, badge, tabular = false }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-[#111827]">{title}</h2>
        <p className={`mt-1 text-sm text-[#92400e] font-medium${tabular ? ' tabular-nums' : ''}`}>{desc}</p>
      </div>
      <span className={BANNER_BADGE}>{badge}</span>
    </div>
  );
}

// 보내는 주소: 판매자 배송지(최대 4개) 중 하나를 고름. 처음엔 기본 배송지, 없으면 안내 문구 + 수락 버튼 막힘 (시안 08-5-3)
// 시안의 버튼 모양을 그리고, 그 위에 투명한 select를 겹쳐 브라우저 기본 목록으로 고르게 함
// sender = { options: [{ addressId, isDefault, text }], selectedId, onChange(addressId) }
function SenderAddressSelect({ sender, disabled }) {
  const selected = sender.options.find((option) => option.addressId === sender.selectedId) ?? null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="sender-address" className="text-sm font-bold text-[#111827]">
          보내는 주소
        </label>
        <Link to="/mypage/addresses" className="text-[13px] font-semibold text-[#0f4c3a] underline">
          배송지 관리
        </Link>
      </div>
      <div className="relative">
        <div className="w-full h-12 px-4 flex items-center gap-3 bg-white border border-[#d1d5db] text-left">
          {selected?.isDefault && (
            <span className="h-6 px-2 inline-flex items-center text-xs font-semibold bg-[#0f4c3a] text-white shrink-0">기본</span>
          )}
          <span className="flex-1 min-w-0 truncate text-[15px] text-[#111827]">
            {selected ? selected.text : '등록된 배송지가 없어요. 배송지 관리에서 먼저 추가해 주세요'}
          </span>
          <svg className="w-5 h-5 text-[#6b7280] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {sender.options.length > 0 && (
          <select
            id="sender-address"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            value={sender.selectedId ?? ''}
            onChange={(event) => sender.onChange(Number(event.target.value))}
            disabled={disabled}
          >
            {sender.options.map((option) => (
              <option key={option.addressId} value={option.addressId}>
                {option.isDefault ? `[기본] ${option.text}` : option.text}
              </option>
            ))}
          </select>
        )}
      </div>
      <p className="text-[13px] text-[#6b7280]">
        택배 기사님이 이 주소로 상품을 가지러 와요. 수락한 뒤에 배송지를 고쳐도 이 주문은 여기서 고른 주소로 보내요.
      </p>
    </div>
  );
}

// 수락 대기: 보낼 수 없는 상품만 체크해 거절
function AcceptBanner({ accept, items }) {
  return (
    <section className="bg-[#fffbeb] border-2 border-[#fde68a] p-6 space-y-5">
      <BannerHead
        title="주문을 수락해 주세요"
        desc={`${accept.deadlineText ? `${accept.deadlineText}까지 ` : ''}응답하지 않으면 자동으로 거절되고 구매자에게 환불돼요`}
        badge="수락 대기"
        tabular
      />
      <div className="space-y-2">
        <p className="text-sm font-bold text-[#111827]">보낼 수 없는 상품만 체크해 주세요</p>
        {items.map((item) => {
          const checked = accept.rejectIds.includes(item.orderItemId);
          return (
            <label
              key={item.orderItemId}
              className={`px-4 py-3 flex items-center gap-4 border cursor-pointer ${
                checked ? 'border-[#fecaca] bg-[#fef2f2]' : 'border-[#e5e7eb] bg-white'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => accept.onToggle(item.orderItemId)}
                disabled={accept.isSubmitting}
              />
              {checked ? (
                <span className="w-5 h-5 flex items-center justify-center bg-[#b91c1c] border-2 border-[#b91c1c] text-white shrink-0">
                  <CheckIcon className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="w-5 h-5 bg-white border-2 border-[#d1d5db] shrink-0"></span>
              )}
              <img src={item.thumbnailUrl} alt={item.name} className="w-14 h-14 object-cover border border-[#e5e7eb] shrink-0" />
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-[15px] font-medium text-[#111827]">{item.name}</p>
                {checked && <p className="text-xs font-semibold text-[#b91c1c]">{`거절 · 구매자에게 ${item.priceText}이 환불돼요`}</p>}
              </div>
              <p className="text-[15px] font-bold text-[#111827] shrink-0">{item.priceText}</p>
            </label>
          );
        })}
      </div>
      <p className="px-4 py-3 bg-white border border-[#fde68a] text-sm text-[#92400e] leading-relaxed">{accept.summary}</p>
      <SenderAddressSelect sender={accept.sender} disabled={accept.isSubmitting} />
      <div className="flex flex-col items-end">
        <button
          type="button"
          className="h-12 px-7 bg-[#0f4c3a] text-white text-[15px] font-bold disabled:opacity-50"
          onClick={accept.onSubmit}
          disabled={accept.isSubmitting || accept.sender.selectedId == null}
        >
          {accept.submitLabel}
        </button>
        <ActionErrorLine message={accept.errorMessage} />
      </div>
    </section>
  );
}

// 반품 신청: 승인 · 거절
function ReturnBanner({ returnRequest }) {
  const { item } = returnRequest;
  return (
    <section className="bg-[#fffbeb] border-2 border-[#fde68a] p-6 space-y-5">
      <BannerHead
        title="반품 신청이 왔어요"
        desc={`${returnRequest.deadlineText ? `${returnRequest.deadlineText}까지 ` : ''}응답하지 않으면 자동으로 승인돼요${returnRequest.requestedAtText ? ` · 신청 ${returnRequest.requestedAtText}` : ''}`}
        badge="반품 신청"
        tabular
      />
      <div className="px-4 py-3 bg-white border border-[#e5e7eb] flex items-center gap-4">
        <img src={item.thumbnailUrl} alt={item.name} className="w-14 h-14 object-cover border border-[#e5e7eb] shrink-0" />
        <p className="flex-1 text-[15px] font-medium text-[#111827]">{item.name}</p>
        <p className="text-[15px] font-bold text-[#111827]">{item.priceText}</p>
      </div>
      <dl className="grid grid-cols-[72px_1fr] gap-y-2 text-sm">
        <dt className="text-[#6b7280]">사유</dt>
        <dd className="font-semibold text-[#111827]">{returnRequest.reason}</dd>
        <dt className="text-[#6b7280]">설명</dt>
        <dd className="text-[#111827] leading-relaxed">{returnRequest.detail}</dd>
      </dl>
      <ul className="px-4 py-3 bg-white border border-[#fde68a] space-y-1 text-[13px] text-[#4b5563] leading-relaxed">
        <li>{`· 승인하면 택배사가 구매자에게서 상품을 가져와요. 반품 배송비는 구매 때 배송비와 같은 ${returnRequest.shippingFeeText}이고, 판매자가 내서 정산금에서 빠져요.`}</li>
        <li>{`· 상품이 도착하면 ${item.priceText}이 구매자에게 환불돼요.`}</li>
        <li>· 거절하면 이 상품은 바로 구매 확정돼요.</li>
      </ul>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="h-12 w-[120px] flex items-center justify-center bg-white border border-[#d1d5db] text-[15px] font-bold text-[#b91c1c]"
          onClick={() => returnRequest.onOpen('REJECT')}
        >
          거절
        </button>
        <button
          type="button"
          className="h-12 w-[120px] flex items-center justify-center bg-[#0f4c3a] border border-[#0f4c3a] text-white text-[15px] font-bold"
          onClick={() => returnRequest.onOpen('APPROVE')}
        >
          승인
        </button>
      </div>
    </section>
  );
}

// 반품 승인 · 거절 확인 모달
function ReturnModal({ returnRequest }) {
  const { modal, item } = returnRequest;
  if (!modal) return null;
  const isApprove = modal === 'APPROVE';
  return (
    <Modal
      title={isApprove ? '반품을 승인할까요?' : '반품을 거절할까요?'}
      onClose={returnRequest.onClose}
      footer={
        <>
          <ModalButton fit onClick={returnRequest.onClose} disabled={returnRequest.isSubmitting}>
            닫기
          </ModalButton>
          <ModalButton
            fit
            variant={isApprove ? 'primary' : 'danger'}
            onClick={returnRequest.onConfirm}
            disabled={returnRequest.isSubmitting}
          >
            {isApprove ? '승인' : '거절하기'}
          </ModalButton>
        </>
      }
    >
      {isApprove ? (
        <>
          <p className="text-[#4b5563] leading-relaxed">
            택배사가 구매자에게서 상품을 가져와요. 상품이 도착하면 구매자에게 환불돼요.
          </p>
          <div className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
            <div className="px-4 py-3 flex justify-between">
              <span className="text-[#6b7280]">구매자 환불</span>
              <span className="font-semibold text-[#111827]">{item.priceText}</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span className="text-[#6b7280]">반품 배송비 (구매 때 배송비 · 판매자 부담)</span>
              <span className="font-semibold text-[#b91c1c]">{returnRequest.shippingFeeText}</span>
            </div>
          </div>
          <p className="text-[13px] text-[#6b7280]">반품 배송비는 정산할 때 정산금에서 빠져요.</p>
        </>
      ) : (
        <p className="text-[#4b5563] leading-relaxed">
          거절하면 반품은 진행되지 않고 <span className="font-semibold text-[#111827]">{item.shortName}</span>는 바로 구매
          확정돼요. 거절한 뒤에는 되돌릴 수 없어요.
        </p>
      )}
      <ActionErrorBar message={returnRequest.errorMessage} />
    </Modal>
  );
}

// 배송 단계
function ShipmentSteps({ step, stepTimes }) {
  return (
    <ol className="px-6 pt-5 pb-4 flex">
      {SALES_SHIPMENT_STEPS.map((label, index) => {
        const done = index <= step;
        const now = index === step;
        return (
          <li key={label} className="relative flex-1 flex flex-col items-center gap-1.5">
            {index > 0 && (
              <span
                className={`absolute top-[13px] right-1/2 w-full h-0.5 ${done ? 'bg-[#0f4c3a]' : 'bg-[#e5e7eb]'}`}
                style={{ marginRight: '14px' }}
              ></span>
            )}
            <span className="relative z-10">
              {done ? (
                <span
                  className={`w-7 h-7 flex items-center justify-center bg-[#0f4c3a] text-white${
                    now ? ' ring-2 ring-offset-2 ring-[#0f4c3a]' : ''
                  }`}
                >
                  <CheckIcon />
                </span>
              ) : (
                <span className="block w-7 h-7 bg-white border-2 border-[#d1d5db]"></span>
              )}
            </span>
            <span
              className={
                now
                  ? 'text-xs text-[#0f4c3a] font-bold'
                  : done
                    ? 'text-xs text-[#4b5563] font-medium'
                    : 'text-xs text-[#9ca3af] font-medium'
              }
            >
              {label}
            </span>
            <span className="text-[11px] text-[#6b7280] tabular-nums h-4">{stepTimes[index] ?? ''}</span>
          </li>
        );
      })}
    </ol>
  );
}

// 시안 08-5-2 수락 대기 · 08-5-3 수락 대기 · 배송지 없음 · 08-5-4 판매 주문 상세, 04-2-1 · 04-5-1 ~ 04-5-3 취소 · 반품 상태 (화면만, 데이터는 props)
// mode: ACCEPT(수락 대기) · NORMAL · CANCEL_RETURN(구매자 취소 반송 중) · RETURN_REQUESTED(반품 신청)
// 시안 08-5-5: 픽업 대기일 때 수거지까지 기사님 거리 (값이 없으면 그리지 않음)
function DistanceBox({ distance, refreshCooldown, onRefresh }) {
  return (
    <div className="mx-6 mb-4 px-4 py-3 border bg-[#f9fafb] border-[#e5e7eb] space-y-1">
      <div className="flex items-center gap-3">
        <p className="text-sm text-[#111827]">
          {'수거지까지 기사님 거리 약 '}
          <b className="tabular-nums">{distance.km}</b>{' '}
          {distance.checkedAt && (
            <span className="text-[13px] text-[#6b7280] tabular-nums">{`· ${distance.checkedAt} 기준`}</span>
          )}
        </p>
        <span className="ml-auto">
          {refreshCooldown > 0 ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-[#9ca3af] tabular-nums">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
              {`${refreshCooldown}초 뒤 새로고침`}
            </span>
          ) : (
            <button type="button" className="flex items-center gap-1 text-xs font-semibold text-[#0f4c3a]" onClick={onRefresh}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
              새로고침
            </button>
          )}
        </span>
      </div>
      <p className="text-xs font-medium text-[#92400e]">
        기사님이 수거지 2km 안으로 들어오면 구매자가 주문을 취소할 수 없어요. 상품을 미리 포장해 두세요.
      </p>
      <p className="text-xs text-[#6b7280]">표시된 거리는 조회한 순간 기준이라 실제와 다를 수 있어요.</p>
    </div>
  );
}

function SalesOrderDetailView({
  order,
  accept,
  returnRequest,
  refreshCooldown = 0,
  onOpenTracking = () => {},
  onRefreshDistance = () => {},
}) {
  const { mode, shipment, settlement } = order;
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[960px] mx-auto space-y-6">
        <PageBackLink to="/orders/seller" label="판매 주문" />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">판매 주문 상세</h1>
          <p className="text-sm text-[#6b7280] tabular-nums">{order.headerText}</p>
        </div>

        {mode === 'ACCEPT' && <AcceptBanner accept={accept} items={order.items} />}
        {mode === 'RETURN_REQUESTED' && <ReturnBanner returnRequest={returnRequest} />}
        {mode === 'CANCEL_RETURN' && (
          <section className="bg-[#fffbeb] border-2 border-[#fde68a] p-6 space-y-3">
            <BannerHead
              title="구매자가 주문을 취소했어요"
              desc="취소된 상품이 택배사를 통해 돌아오고 있어요 · 도착하면 「반송 완료」로 바뀌어요"
              badge="반송 중"
            />
            <p className="px-4 py-3 bg-white border border-[#fde68a] text-[13px] text-[#4b5563] leading-relaxed">
              취소가 확정되기 전에 택배사가 이미 상품을 가져가 판매자에게 돌려보내는 중이에요. 결제 금액은 구매자에게 환불됐고, 이
              주문은 정산하지 않아요. 반송 비용은 택배사가 부담해요.
            </p>
          </section>
        )}

        {mode !== 'ACCEPT' && (
          <section className="bg-white border border-[#e5e7eb]">
            <CardHead title="주문 상품" />
            <ul className="divide-y divide-[#f3f4f6]">
              {order.items.map((item) => (
                <li key={item.orderItemId} className="px-6 py-4 flex items-center gap-4">
                  <img src={item.thumbnailUrl} alt={item.name} className="w-16 h-16 object-cover border border-[#e5e7eb] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-[#111827]">{item.name}</p>
                    {item.statusText && <p className={`mt-0.5 text-xs font-semibold ${item.statusTone}`}>{item.statusText}</p>}
                  </div>
                  <p className="text-[15px] font-bold text-[#111827] shrink-0">{item.priceText}</p>
                </li>
              ))}
            </ul>
            {order.saleFooter && (
              <div className="px-6 py-4 border-t border-[#e5e7eb] flex justify-between text-sm">
                <span className="text-[#6b7280]">{order.saleFooter.label}</span>
                <span className="font-bold text-[#111827]">{order.saleFooter.amountText}</span>
              </div>
            )}
          </section>
        )}

        <section className="bg-white border border-[#e5e7eb]">
          <CardHead title="구매자 배송지" />
          <dl className="px-6 py-5 grid grid-cols-[88px_1fr] gap-y-3 text-sm">
            <dt className="text-[#6b7280]">받는 사람</dt>
            <dd className="font-semibold text-[#111827]">{order.recipient.name}</dd>
            <dt className="text-[#6b7280]">연락처</dt>
            <dd className="text-[#111827] tabular-nums">
              {order.recipient.phone} <span className="ml-1 text-xs text-[#6b7280]">가운데 4자리는 가려서 보여요</span>
            </dd>
            <dt className="text-[#6b7280]">주소</dt>
            <dd className="text-[#111827]">{order.recipient.address}</dd>
          </dl>
        </section>

        {shipment?.cancelledNote && (
          <section className="bg-white border border-[#e5e7eb]">
            <CardHead title="배송" />
            <p className="px-6 py-5 text-sm text-[#4b5563]">{shipment.cancelledNote}</p>
          </section>
        )}

        {shipment && !shipment.cancelledNote && (
          <section className="bg-white border border-[#e5e7eb]">
            <CardHead title="배송">
              {!shipment.headTrackingHidden && (
                <span className="text-sm text-[#4b5563]">
                  송장번호 <span className="font-semibold text-[#111827] tabular-nums">{shipment.trackingNo}</span>
                </span>
              )}
            </CardHead>
            {shipment.note && <div className="px-6 pt-4 text-[13px] text-[#6b7280]">{shipment.note}</div>}
            {shipment.returnTimeline ? (
              <ReturnTimeline
                deliveredTime={shipment.returnTimeline.deliveredTime}
                steps={shipment.returnTimeline.steps}
                tracking={shipment.returnTimeline.tracking}
                onOpenTracking={onOpenTracking}
              />
            ) : (
              shipment.step !== null && <ShipmentSteps step={shipment.step} stepTimes={shipment.stepTimes} />
            )}
            {shipment.distance && (
              <DistanceBox distance={shipment.distance} refreshCooldown={refreshCooldown} onRefresh={onRefreshDistance} />
            )}
            {!shipment.headTrackingHidden && (
              <div className={`px-6 py-3${shipment.step !== null && !shipment.returnTimeline ? ' border-t' : ''} border-[#f3f4f6] flex items-center gap-3`}>
                {shipment.location && (
                  <span className="flex items-center gap-1.5 text-[13px] text-[#111827]">
                    <svg className="w-4 h-4 text-[#0f4c3a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {`현재 위치: ${shipment.location}`}
                  </span>
                )}
                <span className="ml-auto">
                  <button
                    type="button"
                    className="shrink-0 flex items-center gap-0.5 text-[13px] font-semibold text-[#0f4c3a]"
                    onClick={onOpenTracking}
                  >
                    배송 조회
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </span>
              </div>
            )}
          </section>
        )}

        <section className="bg-white border border-[#e5e7eb]">
          <CardHead title="정산">
            <span className={`h-7 px-2.5 flex items-center border text-[13px] font-semibold shrink-0 ${settlement.badgeTone}`}>
              {settlement.badgeText}
            </span>
          </CardHead>
          {settlement.amounts ? (
            <div className="px-6 py-5 space-y-4">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#6b7280]">판매액</dt>
                  <dd className="font-semibold text-[#111827]">{settlement.amounts.saleText}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6b7280]">수수료 (5%)</dt>
                  <dd className="font-semibold text-[#b91c1c]">{settlement.amounts.feeText}</dd>
                </div>
                {settlement.amounts.burdenText && (
                  <div className="flex justify-between">
                    <dt className="text-[#6b7280]">판매자 부담금</dt>
                    <dd className="font-semibold text-[#b91c1c]">{settlement.amounts.burdenText}</dd>
                  </div>
                )}
                <div className="pt-3 border-t border-[#e5e7eb] flex justify-between items-baseline">
                  <dt className="text-[15px] font-bold text-[#111827]">{settlement.amounts.payoutLabel}</dt>
                  <dd className="text-xl font-black text-[#0f4c3a] tracking-tight">{settlement.amounts.payoutText}</dd>
                </div>
              </dl>
              <p className="text-[13px] text-[#6b7280]">{settlement.note}</p>
            </div>
          ) : (
            <p className="px-6 py-5 text-sm text-[#4b5563]">{settlement.note}</p>
          )}
        </section>
      </div>

      {returnRequest && <ReturnModal returnRequest={returnRequest} />}
    </main>
  );
}

export default SalesOrderDetailView;
