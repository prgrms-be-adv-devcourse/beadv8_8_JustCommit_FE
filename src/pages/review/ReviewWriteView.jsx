import { ActionErrorLine } from '../../components/common/ActionError';
import PageBackLink from '../../components/common/PageBackLink';
import { Star } from '../../components/review/Stars';
import { REVIEW_CONTENT_MAX, REVIEW_TAGS, formatRating, starFill } from '../../constants/review';

// 시안 05-2-1 리뷰 작성 · 05-2-2 판매자 선택 메뉴 열림
// props
//   backTo: 주문 상세 경로
//   sellers = [{ sellerOrderId, sellerNickname, thumbnailUrl, summary, written, untilText('10월 20일') }]
//   selected = { sellerOrderId, sellerNickname, thumbnailUrl, summary, confirmedDateText, untilText, items[{ productName, thumbnailUrl }] }
//   menuOpen, onToggleMenu, onSelect(sellerOrderId)
//   rating(0 = 안 고름), onRatingChange, tags[], onToggleTag(code), content, onContentChange
//   canSubmit, isSubmitting, onSubmit, submitError

function Chevron({ open }) {
  return (
    <svg className="w-5 h-5 text-[#4b5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
    </svg>
  );
}

function SellerOption({ seller, isSelected, onSelect }) {
  if (seller.written) {
    return (
      <li className="px-3 py-2.5 flex items-center gap-3 bg-white cursor-not-allowed" role="option" aria-selected={false} aria-disabled="true">
        <img src={seller.thumbnailUrl} alt={seller.sellerNickname} className="w-10 h-10 object-cover border border-[#e5e7eb] shrink-0 opacity-50" />
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] text-[#9ca3af]">{seller.sellerNickname}</span>
          <span className="block text-[13px] text-[#9ca3af] truncate">{seller.summary}</span>
        </span>
        <span className="h-6 px-2 flex items-center bg-[#f3f4f6] text-xs font-semibold text-[#6b7280]">작성 완료</span>
      </li>
    );
  }
  return (
    <li
      className={`px-3 py-2.5 flex items-center gap-3 ${isSelected ? 'bg-[#f4f8f6]' : 'bg-white'}`}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={() => onSelect(seller.sellerOrderId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onSelect(seller.sellerOrderId);
      }}
    >
      <img src={seller.thumbnailUrl} alt={seller.sellerNickname} className="w-10 h-10 object-cover border border-[#e5e7eb] shrink-0" />
      <span className="flex-1 min-w-0">
        <span className={`block text-[15px] ${isSelected ? 'font-semibold ' : ''}text-[#111827]`}>{seller.sellerNickname}</span>
        <span className="block text-[13px] text-[#9ca3af] truncate">{seller.summary}</span>
      </span>
      {isSelected ? (
        <span className="text-[#0f4c3a]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      ) : (
        <span className="text-xs text-[#92400e]">{`${seller.untilText}까지`}</span>
      )}
    </li>
  );
}

// 별 5개 입력: 별 왼쪽 반을 누르면 0.5점, 오른쪽 반은 1점
function StarInput({ rating, onChange }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="별점">
      {[0, 1, 2, 3, 4].map((index) => (
        <span key={index} className="flex relative">
          <Star fill={starFill(rating, index)} size="w-12 h-12" />
          <button
            type="button"
            className="absolute inset-y-0 left-0 w-1/2"
            aria-label={`${index + 0.5}점`}
            onClick={() => onChange(index + 0.5)}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 w-1/2"
            aria-label={`${index + 1}점`}
            onClick={() => onChange(index + 1)}
          />
        </span>
      ))}
    </div>
  );
}

function ReviewWriteView({
  backTo,
  sellers,
  selected,
  menuOpen,
  onToggleMenu,
  onSelect,
  rating,
  onRatingChange,
  tags,
  onToggleTag,
  content,
  onContentChange,
  canSubmit,
  isSubmitting,
  onSubmit,
  submitError,
}) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[720px] mx-auto space-y-6">
        <PageBackLink to={backTo} label="주문 상세" />
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">리뷰 작성</h1>
        <section className="bg-white border border-[#e5e7eb] p-8 space-y-7">
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#111827]">리뷰를 쓸 판매자</p>
            <div className="relative">
              <button
                type="button"
                className={`w-full h-16 px-3 flex items-center gap-3 border ${menuOpen ? 'border-[#0f4c3a]' : 'border-[#d1d5db]'} bg-white text-left`}
                aria-haspopup="listbox"
                aria-expanded={menuOpen}
                onClick={onToggleMenu}
              >
                <img src={selected.thumbnailUrl} alt={selected.items[0]?.productName ?? ''} className="w-11 h-11 object-cover border border-[#e5e7eb] shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-[#111827]">{selected.sellerNickname}</span>
                  <span className="block text-[13px] text-[#6b7280] truncate">{selected.summary}</span>
                </span>
                <Chevron open={menuOpen} />
              </button>
              {menuOpen && (
                <ul className="absolute z-10 top-[68px] left-0 right-0 p-1.5 bg-white border border-[#d1d5db] shadow-lg space-y-1" role="listbox">
                  {sellers.map((seller) => (
                    <SellerOption
                      key={seller.sellerOrderId}
                      seller={seller}
                      isSelected={seller.sellerOrderId === selected.sellerOrderId}
                      onSelect={onSelect}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="p-4 bg-[#f9fafb] border border-[#e5e7eb] space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-[#111827]">{selected.sellerNickname}</span>
              <span className="ml-auto text-[13px] text-[#6b7280] tabular-nums">{`구매 확정 ${selected.confirmedDateText}`}</span>
            </div>
            <p className="px-3 py-2 bg-white border border-[#fde68a] text-sm font-semibold text-[#92400e]">
              {`${selected.untilText}까지 작성할 수 있어요 `}
              <span className="font-normal text-[#6b7280]">· 구매 확정 후 3일</span>
            </p>
            {selected.items.map((item) => (
              <div key={item.productName} className="flex items-center gap-3">
                <img src={item.thumbnailUrl} alt={item.productName} className="w-16 h-16 object-cover border border-[#e5e7eb]" />
                <span className="text-[15px] font-medium text-[#111827]">{item.productName}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-bold text-[#111827]">별점</p>
            <StarInput rating={rating} onChange={onRatingChange} />
            {rating > 0 ? (
              <p className="text-[15px] font-semibold text-[#111827]">{formatRating(rating)}</p>
            ) : (
              <p className="text-[15px] text-[#6b7280]">별점을 선택해 주세요</p>
            )}
            <p className="text-xs text-[#9ca3af]">별의 왼쪽 반을 누르면 0.5점 단위로 고를 수 있어요</p>
          </div>
          <div className="space-y-2.5">
            <p className="text-sm font-bold text-[#111827]">
              이런 점이 좋았어요 <span className="text-[13px] font-normal text-[#6b7280]">선택 · 여러 개 고를 수 있어요</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((tag) => {
                const on = tags.includes(tag.code);
                return (
                  <button
                    key={tag.code}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onToggleTag(tag.code)}
                    className={
                      on
                        ? 'h-11 px-4 flex items-center bg-[#f4f8f6] border border-[#0f4c3a] text-sm font-semibold text-[#0f4c3a]'
                        : 'h-11 px-4 flex items-center bg-white border border-[#d1d5db] text-sm font-medium text-[#4b5563]'
                    }
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#111827]">내용</p>
            <div className="relative">
              <textarea
                rows="6"
                maxLength={REVIEW_CONTENT_MAX}
                placeholder="식물 상태, 포장, 받아 본 느낌을 적어 주세요. (10 ~ 300자)"
                aria-label="리뷰 내용"
                className="w-full p-4 pb-9 border border-[#d1d5db] text-[15px] leading-relaxed resize-none focus:ring-0 focus:border-[#0f4c3a]"
                value={content}
                onChange={(event) => onContentChange(event.target.value)}
              />
              <span className="absolute right-4 bottom-3 text-[13px] text-[#6b7280] tabular-nums">{`${content.length} / ${REVIEW_CONTENT_MAX}`}</span>
            </div>
            <p className="text-[13px] text-[#6b7280]">10자 이상 300자 이하로 써 주세요</p>
          </div>
          <div className="space-y-2">
            {canSubmit && !isSubmitting ? (
              <button type="button" className="w-full h-14 bg-[#0f4c3a] text-white text-base font-bold" onClick={onSubmit}>
                등록하기
              </button>
            ) : (
              <button type="button" disabled className="w-full h-14 bg-[#f3f4f6] text-[#9ca3af] text-base font-bold cursor-not-allowed">
                등록하기
              </button>
            )}
            <ActionErrorLine message={submitError} className="text-center" />
            <p className="text-[13px] text-[#6b7280] text-center">
              별점을 고르고 내용을 10 ~ 300자로 써 주세요 · 등록한 리뷰는 수정할 수 없고, 3일 안에만 삭제할 수 있어요
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ReviewWriteView;
