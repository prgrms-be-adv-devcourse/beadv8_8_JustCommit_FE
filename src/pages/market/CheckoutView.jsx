import { ActionErrorLine } from '../../components/common/ActionError';
import Modal from '../../components/common/Modal';
import ModalButton from '../../components/common/ModalButton';
import { formatPrice } from '../../utils/format';

// 시안 03-2 주문서 (Order · OrderShort · OrderJeju · OrderPriceUpdated · OrderPending + 모달 4종)
// 데이터는 모두 props로 받음 → 페이지(CheckoutPage)가 API를 부르고, 비교 하네스는 가짜 데이터를 넣음

// 배송지 카드
// address = { recipientName, phone(가린 번호), addressText, isDefault }
function AddressCard({ address, canChange, notice, onChange, onAdd }) {
  return (
    <section className="bg-white border border-[#e5e7eb] p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[#e5e7eb] mb-5">
        <h2 className="text-lg font-bold text-[#111827]">배송지</h2>
        {canChange && (
          <button
            type="button"
            className="h-7 px-3 bg-white hover:bg-[#f9fafb] text-[#111827] border border-[#d1d5db] text-xs font-medium flex items-center justify-center"
            onClick={address ? onChange : onAdd}
          >
            {address ? '변경' : '추가'}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {address ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#111827]">{address.recipientName}</span>
              {address.isDefault && (
                <span className="bg-[#f4f8f6] text-[#0f4c3a] text-xs px-2 py-0.5 font-semibold border border-[#d1e7dd]">
                  기본 배송지
                </span>
              )}
            </div>
            <div className="text-sm text-[#4b5563]">{address.phone}</div>
            <div className="text-sm font-medium text-[#111827]">{address.addressText}</div>
          </>
        ) : (
          // 시안에 없는 경우: 저장한 배송지가 하나도 없을 때
          <div className="text-sm text-[#4b5563]">등록된 배송지가 없어요. 배송지를 추가해야 결제할 수 있어요.</div>
        )}
        <div className="pt-2 text-xs text-[#6b7280] flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>배송지에 따라 배송비가 달라져요. 제주 · 도서산간은 추가 요금이 있어요.</span>
        </div>
        {notice && (
          <div className="px-3 py-2 bg-[#f4f8f6] border border-[#d1e7dd] text-xs font-medium text-[#0f4c3a]">{notice}</div>
        )}
      </div>
    </section>
  );
}

// 판매자별 묶음
// group = { key, sellerName, items[{ key, title, thumbnailUrl, price, prevPrice? }], shippingFee, shippingDetail? }
function SellerGroup({ group }) {
  return (
    <div className="border border-[#e5e7eb]">
      <div className="bg-[#f9fafb] px-4 py-2.5 border-b border-[#e5e7eb] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#4b5563]">{`판매자 · ${group.sellerName}`}</span>
        </div>
      </div>

      <div className={group.items.length > 1 ? 'divide-y divide-[#f3f4f6] px-4' : 'px-4'}>
        {group.items.map((item) => (
          <div key={item.key} className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="w-[72px] h-[72px] object-cover border border-[#e5e7eb] shrink-0"
              />
              <div>
                <h3 className="text-[15px] font-medium text-[#111827] leading-snug">{item.title}</h3>
              </div>
            </div>
            <div className="text-right shrink-0">
              {item.prevPrice != null ? (
                <>
                  <span className="block text-[13px] text-[#9ca3af] line-through">{formatPrice(item.prevPrice)}</span>
                  <span className="text-base font-bold text-[#dc2626]">{formatPrice(item.price)}</span>
                </>
              ) : (
                <span className="text-base font-bold text-[#111827]">{formatPrice(item.price)}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#fafafa] px-4 py-2.5 border-t border-[#e5e7eb] flex items-center justify-between text-xs">
        {group.shippingDetail ? (
          <span className="text-[#6b7280]">
            배송비 <span className="text-[#9ca3af]">{group.shippingDetail}</span>
          </span>
        ) : (
          <span className="text-[#6b7280]">배송비</span>
        )}
        <span className="font-bold text-[#111827]">{formatPrice(group.shippingFee)}</span>
      </div>
    </div>
  );
}

function CheckoutView({
  pending = null, // 결제 대기 주문: { remainingText: '09:42' }
  address,
  canChangeAddress = true,
  addressNotice,
  groups,
  itemCount,
  subtotal,
  shippingTotal,
  total,
  balance,
  isSubmitting = false,
  payDisabled = false,
  errorMessage,
  onChangeAddress,
  onAddAddress,
  onPay,
  modal = null,
}) {
  const isBalanceLoaded = balance != null;
  const isShort = isBalanceLoaded && balance < total;

  let payLabel = `${formatPrice(total)} 결제하기`;
  if (isShort) payLabel = '충전하고 결제하기';
  if (isSubmitting) payLabel = '처리하는 중...';

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 py-8">
      <div className="mb-6 flex items-baseline justify-between border-b border-[#e5e7eb] pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">주문서</h1>
        </div>
      </div>
      {pending && (
        <div className="mb-6 px-5 py-4 bg-[#fef2f2] border border-[#fecaca] flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold text-[#b91c1c]">결제 대기 중인 주문이에요</p>
            <p className="mt-1 text-[13px] text-[#4b5563] leading-relaxed">
              주문한 시각부터 10분 안에 충전하고 결제하지 않으면 주문이 취소되고 상품이 다시 판매돼요.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-[#6b7280]">남은 시간</p>
            <p className="text-2xl font-black text-[#dc2626] tabular-nums tracking-tight">{pending.remainingText}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full space-y-6">
          <AddressCard
            address={address}
            canChange={canChangeAddress}
            notice={addressNotice}
            onChange={onChangeAddress}
            onAdd={onAddAddress}
          />

          <section className="bg-white border border-[#e5e7eb] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5e7eb] mb-5">
              <h2 className="text-lg font-bold text-[#111827]">
                주문 상품 <span className="text-[#0f4c3a]">{itemCount}</span>개
              </h2>
            </div>

            <div className="space-y-6">
              {groups.map((group) => (
                <SellerGroup key={group.key} group={group} />
              ))}

              <div className="p-3.5 bg-[#f9fafb] border border-[#e5e7eb] flex items-start gap-2.5 text-[13px] text-[#4b5563] leading-relaxed">
                <svg className="w-5 h-5 text-[#0f4c3a] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                  />
                </svg>
                <span className="space-y-0.5">
                  <span className="block">판매자가 주문을 수락하면 택배 기사가 배정돼요.</span>
                  <span className="block">기사님이 수거지 2km 안으로 들어오면 취소할 수 없고, 수거 뒤에는 반품만 가능해요.</span>
                  <span className="block">판매자가 24시간 안에 수락하지 않으면 자동으로 취소되고 환불돼요.</span>
                </span>
              </div>
            </div>
          </section>
        </div>

        <aside className="w-full lg:w-[360px] shrink-0 sticky top-6 space-y-4">
          <div className="bg-white border border-[#e5e7eb] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#111827] pb-4 border-b border-[#e5e7eb] mb-4">결제 금액</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-[#4b5563]">
                <span>상품 금액</span>
                <span className="font-medium text-[#111827]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-[#4b5563]">
                <span>{`배송비 (판매자 ${groups.length}곳)`}</span>
                <span className="font-medium text-[#111827]">{formatPrice(shippingTotal)}</span>
              </div>

              <div className="pt-3 border-t border-[#e5e7eb] flex justify-between items-baseline">
                <span className="text-base font-bold text-[#111827]">총 결제 금액</span>
                <span className="text-2xl font-black text-[#0f4c3a] tracking-tight">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#111827] pb-3 border-b border-[#e5e7eb] mb-4">결제 수단</h2>

            <div className="border-2 border-[#0f4c3a] bg-[#f4f8f6]/50 p-4 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-none border-2 border-[#0f4c3a] flex items-center justify-center bg-white">
                    <div className="w-2 h-2 bg-[#0f4c3a]" />
                  </div>
                  <span className="font-bold text-[#111827] text-sm">예치금</span>
                </div>
              </div>
              <p className="text-xs text-[#4b5563] ml-6 leading-relaxed">토스페이먼츠로 충전한 예치금으로 결제해요</p>
            </div>

            <div className="space-y-2.5 text-xs text-[#4b5563] pt-1">
              <div className="flex justify-between items-center">
                <span>보유 예치금</span>
                <span className="font-medium text-[#111827]">{isBalanceLoaded ? formatPrice(balance) : '확인 중'}</span>
              </div>
              <div className="flex justify-between items-center text-[#dc2626]">
                <span>결제 금액</span>
                <span className="font-medium">{`− ${formatPrice(total)}`}</span>
              </div>

              <div className="pt-2.5 border-t border-[#e5e7eb] flex justify-between items-center">
                {isShort ? (
                  <>
                    <span className="font-bold text-[#dc2626] text-sm">부족한 금액</span>
                    <span className="font-bold text-[#dc2626] text-sm">{formatPrice(total - balance)}</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-[#111827] text-sm">결제 후 잔액</span>
                    <span className="font-bold text-[#0f4c3a] text-sm">
                      {isBalanceLoaded ? formatPrice(balance - total) : '확인 중'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full h-12 px-6 bg-[#0f4c3a] hover:bg-[#083226] text-white text-base font-bold flex items-center justify-center transition-colors shadow-sm disabled:bg-[#9ca3af] disabled:cursor-not-allowed"
            disabled={payDisabled || isSubmitting || !isBalanceLoaded}
            onClick={onPay}
          >
            {payLabel}
          </button>
          {errorMessage && <ActionErrorLine message={errorMessage} className="-mt-2" />}
          {isShort &&
            (pending ? (
              <p className="text-xs text-[#4b5563] text-center">충전이 끝나면 이 주문을 바로 결제해요.</p>
            ) : (
              <p className="text-xs text-[#4b5563] text-center leading-relaxed">
                누르면 주문이 만들어지고 10분 동안 상품을 잡아 둬요.
                <br />
                충전이 끝나면 이 주문을 바로 결제해요.
              </p>
            ))}

          <div className="p-3 bg-[#f9fafb] border border-[#e5e7eb] text-center">
            <p className="text-xs text-[#6b7280] leading-relaxed">
              결제 금액은 플랫폼이 보관하고, 구매 확정 후 판매자에게 정산돼요.
            </p>
          </div>
        </aside>
      </div>

      {modal}
    </main>
  );
}

// 03-2-4 배송지 변경 모달
// addresses = [{ addressId, recipientName, phone, addressText, isDefault }]
export function AddressChangeModal({ addresses, checkedId, maxCount = 4, onCheck, onAddNew, onClose, onSubmit }) {
  const canAdd = addresses.length < maxCount;
  return (
    <Modal
      title="배송지 변경"
      width={520}
      bodyClassName="space-y-3"
      onClose={onClose}
      footer={
        <>
          <p className="text-xs text-[#6b7280] mr-auto self-center">배송지를 바꾸면 배송비를 다시 계산해요.</p>
          <div className="flex gap-2 shrink-0">
            <ModalButton fit onClick={onClose}>
              취소
            </ModalButton>
            <ModalButton variant="primary" fit disabled={checkedId == null} onClick={onSubmit}>
              이 배송지로 변경
            </ModalButton>
          </div>
        </>
      }
    >
      {addresses.map((address) => {
        const checked = address.addressId === checkedId;
        return (
          <label
            key={address.addressId}
            className={`flex items-start gap-3 p-4 border ${checked ? 'border-[#0f4c3a] bg-[#f4f8f6]' : 'border-[#e5e7eb] bg-white'} cursor-pointer`}
          >
            <input
              type="radio"
              name="checkout-address"
              className="sr-only"
              checked={checked}
              onChange={() => onCheck(address.addressId)}
            />
            {checked ? (
              <span className="mt-0.5 w-4 h-4 shrink-0 border-2 border-[#0f4c3a] flex items-center justify-center">
                <span className="w-2 h-2 bg-[#0f4c3a]" />
              </span>
            ) : (
              <span className="mt-0.5 w-4 h-4 shrink-0 border-2 border-[#d1d5db]" />
            )}
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#111827]">{address.recipientName}</span>
                {address.isDefault && (
                  <>
                    {' '}
                    <span className="bg-[#f4f8f6] text-[#0f4c3a] text-[11px] px-1.5 py-0.5 font-semibold border border-[#d1e7dd]">
                      기본 배송지
                    </span>
                  </>
                )}
              </span>
              <span className="block mt-1 text-[13px] text-[#4b5563]">{address.phone}</span>
              <span className="block mt-0.5 text-[13px] font-medium text-[#111827]">{address.addressText}</span>
            </span>
          </label>
        );
      })}
      <button
        type="button"
        className="w-full h-11 border border-dashed border-[#d1d5db] text-sm font-medium text-[#4b5563] hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:text-[#9ca3af]"
        disabled={!canAdd}
        onClick={onAddNew}
      >
        + 새 배송지 추가
      </button>
      <p className="text-xs text-[#6b7280]">{`배송지는 ${maxCount}개까지 저장할 수 있어요. (${addresses.length} / ${maxCount})`}</p>
    </Modal>
  );
}

// 03-2-5 상품 가격 변경 모달 (결제 때 409 PRICE_CHANGED)
// items = [{ key, title, prevPrice, price }]
export function PriceChangedModal({ items, onClose, onSubmit }) {
  return (
    <Modal
      title="상품 가격이 바뀌었어요"
      width={400}
      onClose={onClose}
      footer={
        <>
          <ModalButton fit onClick={onClose}>
            취소
          </ModalButton>
          <ModalButton variant="primary" fit onClick={onSubmit}>
            바뀐 가격으로 주문
          </ModalButton>
        </>
      }
    >
      <p className="text-[#4b5563] leading-relaxed">판매자가 가격을 바꿨어요. 바뀐 가격으로 주문할까요?</p>
      <div className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
        {items.map((item) => (
          <div key={item.key} className="px-4 py-3 flex justify-between gap-4">
            <span className="text-[#6b7280]">{item.title}</span>
            <span className="shrink-0">
              <span className="text-[#9ca3af] line-through">{formatPrice(item.prevPrice)}</span> →{' '}
              <span className="font-bold text-[#dc2626]">{formatPrice(item.price)}</span>
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// 03-2-7 배송비 변경 모달 (결제 때 SHIPPING_FEE_CHANGED)
// newFee가 없으면(응답에 아직 없음) 자리 문구
export function ShippingFeeChangedModal({ sellerCount, prevFee, newFee, regionLabel, onClose, onSubmit }) {
  return (
    <Modal
      title="배송비가 바뀌었어요"
      width={400}
      onClose={onClose}
      footer={
        <>
          <ModalButton fit onClick={onClose}>
            취소
          </ModalButton>
          <ModalButton variant="primary" fit disabled={newFee == null} onClick={onSubmit}>
            바뀐 금액으로 결제
          </ModalButton>
        </>
      }
    >
      <p className="text-[#4b5563] leading-relaxed">배송지에 따라 배송비가 다시 계산됐어요. 바뀐 금액으로 결제할까요?</p>
      <div className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
        <div className="px-4 py-3 flex justify-between gap-4">
          <span className="text-[#6b7280]">{`이전 배송비 (판매자 ${sellerCount}곳)`}</span>
          <span className="text-[#111827]">{formatPrice(prevFee)}</span>
        </div>
        <div className="px-4 py-3 flex justify-between gap-4">
          <span className="text-[#6b7280]">{`바뀐 배송비 (${regionLabel ?? '{지역}'})`}</span>
          <span className="font-bold text-[#dc2626]">{newFee == null ? '{바뀐 배송비}' : formatPrice(newFee)}</span>
        </div>
      </div>
    </Modal>
  );
}

// 03-2-9 결제 대기 주문에서 나갈 때
export function LeaveModal({ remainingText, total, shortage, onLeave, onStay }) {
  return (
    <Modal
      title="아직 결제하지 않았어요"
      width={400}
      onClose={onStay}
      footer={
        <>
          <ModalButton fit onClick={onLeave}>
            나가기
          </ModalButton>
          <ModalButton variant="primary" fit onClick={onStay}>
            계속 결제하기
          </ModalButton>
        </>
      }
    >
      <p className="text-[#4b5563] leading-relaxed">
        나가도 남은 시간 동안 주문은 유지돼요. 시간 안에 충전하고 결제하지 않으면 주문이 자동으로 취소되고 상품이
        다시 판매돼요.
      </p>
      <div className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
        <div className="px-4 py-3 flex justify-between">
          <span className="text-[#6b7280]">남은 시간</span>
          <span className="font-bold text-[#dc2626] tabular-nums">{remainingText}</span>
        </div>
        <div className="px-4 py-3 flex justify-between">
          <span className="text-[#6b7280]">결제할 금액</span>
          <span className="font-bold text-[#111827]">{formatPrice(total)}</span>
        </div>
        {shortage > 0 && (
          <div className="px-4 py-3 flex justify-between">
            <span className="text-[#6b7280]">부족한 금액</span>
            <span className="font-bold text-[#dc2626]">{formatPrice(shortage)}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-[#6b7280]">주문 목록에서 이어서 결제할 수 있어요.</p>
    </Modal>
  );
}

export default CheckoutView;
