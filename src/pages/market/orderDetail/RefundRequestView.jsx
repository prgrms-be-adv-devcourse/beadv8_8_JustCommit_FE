import { ActionErrorLine } from '../../../components/common/ActionError';
import { RETURN_REASON_LABEL } from '../../../constants/order';
import PageBackLink from '../../../components/common/PageBackLink';

// 시안 04-3-1 · 04-3-2 반품 신청 화면 (데이터는 props로만 받음)
// product = { name, imageUrl, meta, deadline, price }

// 반품 사유 (BE ReturnReason)
const RETURN_REASONS = Object.entries(RETURN_REASON_LABEL).map(([value, label]) => ({ value, label }));

const DETAIL_MAX_LENGTH = 500;

function ReasonOption({ option, checked, onSelect }) {
  return (
    <label
      className={`h-12 px-4 flex items-center gap-3 border ${checked ? 'border-[#0f4c3a] bg-[#f4f8f6]' : 'border-[#e5e7eb] bg-white'} cursor-pointer`}
    >
      <input
        type="radio"
        name="returnReason"
        value={option.value}
        checked={checked}
        onChange={() => onSelect(option.value)}
        className="sr-only"
      />
      {checked ? (
        <span className="w-5 h-5 flex items-center justify-center border-2 border-[#0f4c3a] shrink-0">
          <span className="w-2.5 h-2.5 bg-[#0f4c3a]" />
        </span>
      ) : (
        <span className="w-5 h-5 border-2 border-[#d1d5db] shrink-0" />
      )}
      <span className={checked ? 'text-[15px] text-[#111827] font-semibold' : 'text-[15px] text-[#111827]'}>
        {option.label}
      </span>
    </label>
  );
}

function RefundRequestView({
  backTo,
  product,
  reason,
  detail,
  submitting = false,
  error = null,
  onReasonChange = () => {},
  onDetailChange = () => {},
  onSubmit = () => {},
}) {
  const canSubmit = Boolean(reason) && !submitting;
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[720px] mx-auto space-y-6">
        <PageBackLink to={backTo} label="주문 상세" />
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">반품 신청</h1>
        <section className="bg-white border border-[#e5e7eb] p-8 space-y-7">
          <div className="p-4 bg-[#f9fafb] border border-[#e5e7eb] flex items-center gap-4">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-20 h-20 object-cover border border-[#e5e7eb] shrink-0"
              />
            ) : (
              <span className="w-20 h-20 border border-[#e5e7eb] shrink-0 bg-[#f3f4f6]" aria-hidden="true" />
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-[15px] font-semibold text-[#111827]">{product.name}</p>
              <p className="text-[13px] text-[#6b7280]">{product.meta}</p>
              <p className="text-[13px] text-[#92400e] font-medium">{product.deadline}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-[#6b7280]">결제 금액</p>
              <p className="text-lg font-black text-[#0f4c3a] tracking-tight">{product.price}</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-bold text-[#111827]">
              {'반품 사유 '}
              <span className="text-[#b91c1c]">*</span>
            </p>
            <div className="space-y-2" role="radiogroup" aria-label="반품 사유">
              {RETURN_REASONS.map((option) => (
                <ReasonOption
                  key={option.value}
                  option={option}
                  checked={reason === option.value}
                  onSelect={onReasonChange}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#111827]">
              {'상세 설명 '}
              <span className="text-[13px] font-normal text-[#6b7280]">(선택)</span>
            </p>
            <div className="relative">
              <textarea
                rows={5}
                maxLength={DETAIL_MAX_LENGTH}
                placeholder="받은 식물의 상태를 적어 주시면 판매자가 확인하는 데 도움이 돼요."
                className="w-full p-4 pb-9 border border-[#d1d5db] text-[15px] leading-relaxed text-[#111827] resize-none focus:ring-0 focus:border-[#0f4c3a]"
                aria-label="상세 설명"
                value={detail}
                onChange={(event) => onDetailChange(event.target.value)}
              />
              <span className="absolute right-4 bottom-3 text-[13px] text-[#6b7280] tabular-nums">
                {`${detail.length} / ${DETAIL_MAX_LENGTH}`}
              </span>
            </div>
          </div>
          <ul className="p-4 bg-[#f4f8f6] border border-[#d1e7dd] space-y-1.5">
            {[
              '판매자가 48시간 안에 승인하거나 거절해요. 응답이 없으면 자동으로 승인돼요.',
              '승인되면 택배사가 상품을 가지러 가요. 반품 배송비는 판매자가 내요.',
              `상품이 판매자에게 도착하면 ${product.price}이 예치금으로 환불돼요.`,
              '판매자가 거절하면 이 상품은 바로 구매 확정돼요.',
              '단순 변심으로는 반품할 수 없어요.',
            ].map((text) => (
              <li key={text} className="flex gap-2 text-[13px] text-[#0f4c3a] leading-relaxed">
                <span>·</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            {canSubmit ? (
              <button type="button" className="w-full h-14 bg-[#0f4c3a] text-white text-base font-bold" onClick={onSubmit}>
                반품 신청
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full h-14 bg-[#f3f4f6] text-[#9ca3af] text-base font-bold cursor-not-allowed"
              >
                반품 신청
              </button>
            )}
            {!reason && <p className="text-[13px] text-[#6b7280] text-center">반품 사유를 골라 주세요</p>}
            <ActionErrorLine message={error} className="text-center" />
          </div>
        </section>
      </div>
    </main>
  );
}

export default RefundRequestView;
