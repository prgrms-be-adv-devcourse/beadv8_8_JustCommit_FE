import { Link } from 'react-router-dom';
import { ActionErrorLine } from '../../components/common/ActionError';
import Modal from '../../components/common/Modal';
import ModalButton from '../../components/common/ModalButton';
import { formatPrice, formatRelativeTime } from '../../utils/format';

// 시안 03-1 장바구니 (Cart · CartEmpty · CartPriceConfirmed)
// 데이터는 모두 props로 받음 → 페이지(CartPage)가 API를 부르고, 비교 하네스는 가짜 데이터를 넣음

// 시안 head의 체크박스 style(네모 · 초록 체크)을 Tailwind로 옮김
const CHECKBOX_CLASS =
  "appearance-none w-[18px] h-[18px] border border-[#d1d5db] bg-white cursor-pointer inline-grid place-content-center transition-all duration-150 ease-in-out checked:bg-[#0f4c3a] checked:border-[#0f4c3a] checked:before:content-[''] checked:before:w-[10px] checked:before:h-[6px] checked:before:border-l-2 checked:before:border-b-2 checked:before:border-white checked:before:[transform:rotate(-45deg)_translate(1px,-1px)] disabled:bg-[#f3f4f6] disabled:border-[#e5e7eb] disabled:cursor-not-allowed";

function RemoveButton({ item, onRemove, disabled }) {
  return (
    <button
      type="button"
      className="text-[#9ca3af] hover:text-[#111827] p-0.5 transition-colors"
      title="삭제"
      aria-label={`${item.title} 삭제`}
      disabled={disabled}
      onClick={() => onRemove(item)}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

// 썸네일 위 상태 표시 (RESERVED: 30% 어둡게 · SOLD OUT: 60% 어둡게 + 흑백)
function Thumbnail({ item }) {
  const grayscale = item.state === 'soldOut' || item.state === 'unavailable';
  return (
    <div className="relative w-[96px] h-[96px] bg-[#f4f4f5] shrink-0 overflow-hidden border border-[#e5e7eb]">
      {item.thumbnailUrl && (
        <img
          src={item.thumbnailUrl}
          alt={item.title}
          className={`w-full h-full object-cover${grayscale ? ' grayscale' : ''}`}
        />
      )}
      {item.state === 'reserved' && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-1 pointer-events-none">
          <span className="px-1.5 py-0.5 bg-[#0f4c3a] text-white text-[10px] leading-none font-bold border-2 border-white tracking-normal whitespace-nowrap flex items-center justify-center shadow-sm">
            RESERVED
          </span>
        </div>
      )}
      {item.state === 'soldOut' && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 pointer-events-none">
          <span className="px-1.5 py-0.5 bg-black text-white text-[10px] leading-none font-bold border-2 border-white tracking-normal whitespace-nowrap flex items-center justify-center shadow-sm">
            SOLD OUT
          </span>
        </div>
      )}
    </div>
  );
}

// 주문할 수 있는 상품 (가격이 바뀐 상품 포함)
function ActiveRow({ item, onToggle, onRemove, onConfirmPrice }) {
  const priceChanged = item.state === 'priceChanged';
  return (
    <div
      className={`p-5 flex items-start gap-4${priceChanged ? ' bg-[#fffefe]' : ''} hover:bg-[#fafafa] transition-colors`}
    >
      <div className="pt-1">
        <input
          type="checkbox"
          aria-label={`${item.title} 선택`}
          checked={!priceChanged && item.checked}
          disabled={priceChanged}
          onChange={() => onToggle(item)}
          className={CHECKBOX_CLASS}
        />
      </div>
      <Thumbnail item={item} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-semibold text-[#111827] hover:text-[#0f4c3a] transition-colors cursor-pointer">
              <Link to={`/products/${item.productId}`}>{item.title}</Link>
            </h3>
            <p className="text-[13px] text-[#6b7280] mt-1">{`판매자 · ${item.sellerName}`}</p>
            {priceChanged && (
              <div className="mt-2 px-3 py-1.5 bg-[#fef2f2] border border-[#fecaca] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#dc2626] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-[12px] text-[#b91c1c] font-medium leading-tight">
                    가격이 바뀌었어요. 바뀐 가격을 확인해야 주문할 수 있어요.
                  </span>
                </div>
                <button
                  type="button"
                  className="h-6 px-2 bg-white hover:bg-[#f9fafb] text-[#111827] text-[11px] font-medium border border-[#d1d5db] shrink-0 transition-colors"
                  onClick={() => onConfirmPrice(item)}
                >
                  바뀐 가격 확인
                </button>
              </div>
            )}
          </div>
          <div className="flex items-start gap-5 shrink-0">
            {priceChanged ? (
              <div className="text-right">
                <span className="text-[13px] text-[#9ca3af] line-through block">{formatPrice(item.prevPrice)}</span>
                <span className="text-[17px] font-bold text-[#b91c1c]">{formatPrice(item.price)}</span>
              </div>
            ) : (
              <span className="text-[17px] font-bold text-[#111827]">{formatPrice(item.price)}</span>
            )}
            <RemoveButton item={item} onRemove={onRemove} disabled={item.removing} />
          </div>
        </div>
      </div>
    </div>
  );
}

// 지금은 주문할 수 없는 상품: 거래 중(다른 회원이 결제 중) · 판매 완료 · 그 밖의 구매 불가(삭제 · 숨김 · 내 상품)
function DisabledRow({ item, onRemove }) {
  if (item.state === 'reserved') {
    return (
      <div className="p-5 flex items-start gap-4 bg-[#fcfcfc] text-[#6b7280]">
        <div className="pt-1">
          <input type="checkbox" disabled aria-label={`${item.title} 선택`} className={CHECKBOX_CLASS} />
        </div>
        <Thumbnail item={item} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-[#6b7280]">{item.title}</h3>
                <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-semibold bg-white text-[#0f4c3a] border border-[#0f4c3a]">
                  거래 중
                </span>
              </div>
              <p className="text-[13px] text-[#6b7280] mt-1">{`판매자 · ${item.sellerName}`}</p>
              <p className="text-[12px] text-[#6b7280] mt-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#6b7280]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>다른 회원이 결제 중인 상품이라 지금은 주문할 수 없어요.</span>
              </p>
            </div>
            <div className="flex items-start gap-5 shrink-0">
              <span className="text-[17px] font-medium text-[#6b7280]">{formatPrice(item.price)}</span>
              <RemoveButton item={item} onRemove={onRemove} disabled={item.removing} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 판매 완료 시안을 따르고, 그 밖의 구매 불가는 배지 이름 · 안내 문구만 바꿈 (시안에 없는 경우)
  const soldOut = item.state === 'soldOut';
  return (
    <div className="p-5 flex items-start gap-4 bg-[#fcfcfc] text-[#9ca3af]">
      <div className="pt-1">
        <input type="checkbox" disabled aria-label={`${item.title} 선택`} className={CHECKBOX_CLASS} />
      </div>
      <Thumbnail item={item} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-[#6b7280] line-through">{item.title}</h3>
              <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-semibold bg-black text-white">
                {soldOut ? '판매 완료' : item.badge}
              </span>
            </div>
            <p className="text-[13px] text-[#9ca3af] mt-1">{`판매자 · ${item.sellerName}`}</p>
            <p className="text-[12px] text-[#9ca3af] mt-2">
              {soldOut
                ? '판매가 완료된 상품입니다. 장바구니에서 삭제하거나 다른 상품을 찾아보세요.'
                : item.reason}
            </p>
          </div>
          <div className="flex items-start gap-5 shrink-0">
            <span className="text-[17px] font-normal text-[#9ca3af] line-through">{formatPrice(item.price)}</span>
            <RemoveButton item={item} onRemove={onRemove} disabled={item.removing} />
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 화면과 같은 상품 카드 (추천 · 새로 올라온 식물)
function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.productId}`} className="block">
      <article className="group bg-white flex flex-col cursor-pointer">
        <div className="relative w-full aspect-square bg-[#f4f4f5] overflow-hidden border border-[#e5e7eb]">
          {product.thumbnailUrl && (
            <img
              src={product.thumbnailUrl}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>
        <div className="pt-3 flex flex-col">
          <h3 className="text-[15px] font-medium text-[#111827] group-hover:text-[#0f4c3a] transition-colors truncate">
            {product.title}
          </h3>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[18px] font-bold text-[#111827]">{formatPrice(Number(product.price))}</span>
            <span className="text-[12px] text-[#888888]">
              {product.timeText ?? formatRelativeTime(product.createdAt)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// 장바구니에 상품이 있으면 AI 추천, 비었거나 추천이 없으면 새로 올라온 식물
function ProductSection({ recommend }) {
  if (!recommend || recommend.products.length === 0) return null;
  return (
    <>
      <div className="h-px w-full bg-[#e5e7eb] mt-12 mb-10" />
      <section>
        {recommend.isAi ? (
          <>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h2 className="text-[20px] font-bold text-[#111827]">같이 키우기 좋은 식물</h2>
              <span className="inline-flex items-center px-2 py-0.5 text-[12px] font-semibold bg-white text-[#0f4c3a] border border-[#0f4c3a]">
                AI 추천
              </span>
            </div>
            <p className="text-[14px] text-[#6b7280] mb-6">장바구니에 담은 식물과 함께 키우기 좋은 식물이에요.</p>
          </>
        ) : (
          <div className="flex items-center gap-2.5 mb-6">
            <h2 className="text-[20px] font-bold text-[#111827]">새로 올라온 식물</h2>
          </div>
        )}
        <div className="grid grid-cols-4 gap-5">
          {recommend.products.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}

function CartView({
  items,
  selectedCount,
  selectableCount,
  allChecked,
  subtotal,
  sellerCount,
  shippingFee,
  total,
  recommend,
  errorMessage,
  removeConfirmOpen = false,
  onToggle,
  onToggleAll,
  onRemove,
  onAskRemoveSelected,
  onCloseRemoveSelected,
  onRemoveSelected,
  onConfirmPrice,
  onOrder,
}) {
  return (
    <main className="max-w-[1240px] w-full mx-auto px-5 pt-8 pb-16 flex-1">
      <div className="flex items-baseline gap-2.5 mb-6">
        <h1 className="text-[24px] font-bold tracking-tight text-[#111827]">장바구니</h1>
        <span className="text-[16px] text-[#6b7280] font-normal">{`${items.length}개`}</span>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-[#e5e7eb] py-20 px-6 flex flex-col items-center text-center">
          <h2 className="text-[20px] font-bold text-[#111827]">장바구니가 비어 있어요</h2>
          <p className="mt-2 text-[14px] text-[#6b7280]">마음에 드는 식물을 담아 보세요.</p>
          <Link
            to="/"
            className="mt-6 h-12 px-6 bg-[#0f4c3a] hover:bg-[#083226] text-white text-[16px] font-bold flex items-center justify-center transition-colors"
          >
            식물 둘러보기
          </Link>
        </div>
      ) : (
        <div className="flex items-start gap-6">
          <div className="flex-1 bg-white border border-[#e5e7eb]">
            <div className="px-5 py-3.5 bg-white border-b border-[#e5e7eb] flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allChecked}
                  disabled={selectableCount === 0}
                  onChange={onToggleAll}
                  className={CHECKBOX_CLASS}
                />
                <span className="text-[14px] font-medium text-[#111827]">
                  전체 선택 <span className="font-semibold text-[#0f4c3a]">{selectedCount}</span>
                  <span className="text-[#6b7280]">{`/${selectableCount}`}</span>
                </span>
              </label>
              <button
                type="button"
                className="h-7 px-3 bg-white hover:bg-[#f9fafb] text-[#111827] text-[12px] font-normal border border-[#d1d5db] transition-colors"
                disabled={selectedCount === 0}
                onClick={onAskRemoveSelected}
              >
                선택 삭제
              </button>
            </div>

            <div className="divide-y divide-[#e5e7eb]">
              {items.map((item) =>
                item.state === 'normal' || item.state === 'priceChanged' ? (
                  <ActiveRow
                    key={item.key}
                    item={item}
                    onToggle={onToggle}
                    onRemove={onRemove}
                    onConfirmPrice={onConfirmPrice}
                  />
                ) : (
                  <DisabledRow key={item.key} item={item} onRemove={onRemove} />
                ),
              )}
            </div>
          </div>

          <aside className="w-[360px] shrink-0 sticky top-6">
            <div className="bg-white border border-[#e5e7eb] p-6">
              <h2 className="text-[18px] font-bold text-[#111827] pb-4 border-b border-[#e5e7eb]">선택 상품 금액</h2>

              <div className="py-5 space-y-3.5 text-[14px]">
                <div className="flex justify-between items-center">
                  <span className="text-[#4b5563]">{`상품 금액 (${selectedCount}개)`}</span>
                  <span className="font-semibold text-[#111827] text-[15px]">{formatPrice(subtotal)}</span>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#4b5563]">{`예상 배송비 (판매자 ${sellerCount}곳)`}</span>
                    <span className="font-semibold text-[#111827] text-[15px]">{formatPrice(shippingFee)}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-[#6b7280] leading-snug">
                    기본 배송지 기준이에요. 주문서에서 배송지를 바꾸면 다시 계산돼요.
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-[#e5e7eb] my-1" />

              <div className="py-5">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[15px] font-bold text-[#111827]">예상 결제 금액</span>
                  <div className="text-right">
                    <span className="text-[22px] font-black tracking-tight text-[#0f4c3a]">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-full h-12 px-6 bg-[#0f4c3a] hover:bg-[#083226] text-white text-[16px] font-bold flex items-center justify-center transition-colors disabled:bg-[#9ca3af] disabled:cursor-not-allowed"
                disabled={selectedCount === 0}
                onClick={onOrder}
              >
                {`선택 상품 주문하기 (${selectedCount})`}
              </button>
              <ActionErrorLine message={errorMessage} />

              <div className="mt-4 pt-3 border-t border-[#f3f4f6]">
                <p className="text-[12px] text-[#6b7280] leading-relaxed">
                  • 배송비는 판매자별로 한 번씩 붙고, 제주 · 도서산간은 추가 요금이 있어요.
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-[#f8faf9] border border-[#e5e7eb] flex items-center gap-3">
              <svg className="w-5 h-5 text-[#0f4c3a] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div className="text-[12px] leading-tight text-[#4b5563]">
                <strong className="text-[#0f4c3a] font-semibold">예치금 안전결제</strong>
                <br />
                식물 배송 완료 3일 뒤에 자동으로 구매 확정돼요.
              </div>
            </div>
          </aside>
        </div>
      )}

      <ProductSection recommend={recommend} />

      {removeConfirmOpen && (
        <Modal
          title="선택한 상품을 삭제할까요?"
          width={400}
          onClose={onCloseRemoveSelected}
          footer={
            <>
              <ModalButton onClick={onCloseRemoveSelected}>취소</ModalButton>
              <ModalButton variant="danger" onClick={onRemoveSelected}>
                삭제
              </ModalButton>
            </>
          }
        >
          <p className="text-[#4b5563] leading-relaxed">{`${selectedCount}개 상품이 장바구니에서 빠져요.`}</p>
        </Modal>
      )}
    </main>
  );
}

export default CartView;
