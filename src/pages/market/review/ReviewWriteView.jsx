import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActionErrorLine } from '../../../components/common/ActionError';
import PageBackLink from '../../../components/common/PageBackLink';
import { Star } from '../../../components/review/Stars';
import { REVIEW_CONTENT_MAX, REVIEW_TAGS, formatRating, starFill } from '../../../constants/review';
import { REVIEW_STATUS } from './reviewModel';

// 시안 05-2-1 리뷰 작성 · 05-2-2 판매자 선택 드롭다운
// 시안의 상품 사진 자리는 리뷰 상태 API에 사진이 없어 상품 이름만 보여 줌
// rows = toSellerOrderRow 목록, selected = 고른 줄 (쓸 수 있는 판매자가 없거나 주소의 판매자를 못 찾으면 null)
// blockedReason = 정해진 판매자를 쓸 수 없는 이유 (있으면 입력 칸 대신 안내만, 다른 판매자는 직접 골라야 함)
// hasWritable = 이 주문에 지금 쓸 수 있는 판매자가 있는지
// form = { rating, tags, content, contentLength(앞뒤 공백 뺀 글자 수), canSubmit, submitting, errorMessage }
// back = { to, label, state }

function ChevronDown() {
  return (
    <svg
      className="w-5 h-5 text-[#6b7280] shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// 판매자 선택: 쓸 수 있는 판매자만 고를 수 있고, 나머지는 회색으로 상태 표시
function SellerSelect({ rows, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (
        event.type === 'keydown' ? event.key === 'Escape' : !boxRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        className={`w-full h-16 px-3 flex items-center gap-3 border bg-white text-left ${open ? 'border-[#0f4c3a]' : 'border-[#d1d5db]'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {selected ? (
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold text-[#111827]">
              {selected.sellerName}
            </span>
            <span className="block text-[13px] text-[#6b7280] truncate">{selected.itemsText}</span>
          </span>
        ) : (
          <span className="flex-1 min-w-0 text-[15px] text-[#6b7280]">판매자를 골라 주세요</span>
        )}
        {selected && !selected.writable && (
          <span className="h-6 px-2 flex items-center bg-[#f3f4f6] text-xs font-semibold text-[#6b7280] shrink-0">
            {REVIEW_STATUS[selected.status]?.badge}
          </span>
        )}
        <ChevronDown />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="리뷰를 쓸 판매자"
          className="absolute z-10 top-[68px] left-0 right-0 p-1.5 bg-white border border-[#d1d5db] shadow-lg space-y-1"
        >
          {rows.map((row) => {
            const isSelected = row.key === selected?.key;
            if (!row.writable) {
              return (
                <li
                  key={row.key}
                  role="option"
                  aria-selected={false}
                  aria-disabled="true"
                  className="px-3 py-2.5 flex items-center gap-3 bg-white cursor-not-allowed"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] text-[#9ca3af]">{row.sellerName}</span>
                    <span className="block text-[13px] text-[#9ca3af] truncate">
                      {row.itemsText}
                    </span>
                  </span>
                  <span className="h-6 px-2 flex items-center bg-[#f3f4f6] text-xs font-semibold text-[#6b7280] shrink-0">
                    {REVIEW_STATUS[row.status]?.badge}
                  </span>
                </li>
              );
            }
            return (
              <li key={row.key} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={`w-full px-3 py-2.5 flex items-center gap-3 text-left ${isSelected ? 'bg-[#f4f8f6]' : 'bg-white'}`}
                  onClick={() => {
                    onSelect(row.key);
                    setOpen(false);
                  }}
                >
                  <span className="flex-1 min-w-0">
                    <span
                      className={`block text-[15px] text-[#111827] ${isSelected ? 'font-semibold' : ''}`}
                    >
                      {row.sellerName}
                    </span>
                    <span className="block text-[13px] text-[#9ca3af] truncate">
                      {row.itemsText}
                    </span>
                  </span>
                  {isSelected ? (
                    <span className="text-[#0f4c3a]">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="text-xs text-[#92400e] shrink-0">{`${row.deadlineText}까지`}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// 별점 고르기: 별 하나의 왼쪽 반 = 0.5점 단위, 오른쪽 반 = 1점 단위 (시안 「별의 왼쪽 반을 누르면 0.5점」)
function RatingInput({ rating, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || rating;
  return (
    <div
      className="flex gap-1"
      role="radiogroup"
      aria-label="별점"
      onMouseLeave={() => setHover(0)}
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <span key={index} className="relative flex">
          <Star fill={starFill(shown, index)} size="w-12 h-12" />
          {[index + 0.5, index + 1].map((value, half) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value.toFixed(1)}점`}
              className={`absolute inset-y-0 w-1/2 ${half === 0 ? 'left-0' : 'right-0'}`}
              onMouseEnter={() => setHover(value)}
              onFocus={() => setHover(value)}
              onBlur={() => setHover(0)}
              onClick={() => onChange(value)}
            />
          ))}
        </span>
      ))}
    </div>
  );
}

// 정해진 판매자를 쓸 수 없을 때: 이유 + 다른 판매자를 직접 고르라는 안내 (시안에 없는 상태)
function BlockedNotice({ reason, hasWritable, errorMessage, orderTo }) {
  return (
    <div role="status" className="p-4 bg-[#f9fafb] border border-[#e5e7eb] space-y-3">
      <p className="text-[15px] font-bold text-[#111827]">이 판매자에게는 리뷰를 쓸 수 없어요</p>
      <p className="text-sm text-[#4b5563]">{reason}</p>
      <ActionErrorLine message={errorMessage} className="" />
      {hasWritable ? (
        <p className="text-sm font-semibold text-[#0f4c3a]">
          위 목록에서 리뷰를 쓸 판매자를 직접 골라 주세요.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-[#4b5563]">
            이 주문에서 지금 쓸 수 있는 다른 판매자가 없어요.
          </p>
          <Link
            to={orderTo}
            className="h-10 px-4 flex items-center bg-white border border-[#0f4c3a] text-[#0f4c3a] text-sm font-bold"
          >
            주문 상세로 돌아가기
          </Link>
        </div>
      )}
    </div>
  );
}

function ReviewWriteView({
  back,
  rows,
  selected,
  blockedReason,
  hasWritable,
  form,
  onSelect,
  onRate,
  onToggleTag,
  onChangeContent,
  onSubmit,
  orderTo,
}) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[720px] mx-auto space-y-6">
        <PageBackLink to={back.to} state={back.state} label={back.label} />
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">리뷰 작성</h1>
        {selected || blockedReason ? (
          <section className="bg-white border border-[#e5e7eb] p-8 space-y-7">
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#111827]">리뷰를 쓸 판매자</p>
              <SellerSelect rows={rows} selected={selected} onSelect={onSelect} />
            </div>
            {blockedReason ? (
              <BlockedNotice
                reason={blockedReason}
                hasWritable={hasWritable}
                errorMessage={form.errorMessage}
                orderTo={orderTo}
              />
            ) : (
              <>
                <div className="p-4 bg-[#f9fafb] border border-[#e5e7eb] space-y-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[15px] font-bold text-[#111827]">
                      {selected.sellerName}
                    </span>
                    <span className="ml-auto text-[13px] text-[#6b7280] tabular-nums">{`구매 확정 ${selected.confirmedText}`}</span>
                  </div>
                  <p className="px-3 py-2 bg-white border border-[#fde68a] text-sm font-semibold text-[#92400e]">
                    {`${selected.deadlineText}까지 작성할 수 있어요 `}
                    <span className="font-normal text-[#6b7280]">· 구매 확정 후 3일</span>
                  </p>
                  <ul className="space-y-1">
                    {selected.productNames.map((name) => (
                      <li key={name} className="text-[15px] font-medium text-[#111827]">
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm font-bold text-[#111827]">별점</p>
                  <RatingInput rating={form.rating} onChange={onRate} />
                  {form.rating ? (
                    <p className="text-[15px] font-semibold text-[#111827]">
                      {formatRating(form.rating)}
                    </p>
                  ) : (
                    <p className="text-[15px] text-[#6b7280]">별점을 선택해 주세요</p>
                  )}
                  <p className="text-xs text-[#9ca3af]">
                    별의 왼쪽 반을 누르면 0.5점 단위로 고를 수 있어요
                  </p>
                </div>
                <div className="space-y-2.5">
                  <p className="text-sm font-bold text-[#111827]">
                    {'이런 점이 좋았어요 '}
                    <span className="text-[13px] font-normal text-[#6b7280]">
                      선택 · 여러 개 고를 수 있어요
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {REVIEW_TAGS.map((tag) => {
                      const on = form.tags.includes(tag.code);
                      return (
                        <button
                          key={tag.code}
                          type="button"
                          aria-pressed={on}
                          className={`h-11 px-4 flex items-center border text-sm ${on ? 'bg-[#f4f8f6] border-[#0f4c3a] font-semibold text-[#0f4c3a]' : 'bg-white border-[#d1d5db] font-medium text-[#4b5563]'}`}
                          onClick={() => onToggleTag(tag.code)}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="review-content"
                    className="block text-sm font-bold text-[#111827]"
                  >
                    내용
                  </label>
                  <div className="relative">
                    <textarea
                      id="review-content"
                      rows="6"
                      maxLength={REVIEW_CONTENT_MAX}
                      placeholder="식물 상태, 포장, 받아 본 느낌을 적어 주세요. (10 ~ 300자)"
                      className="w-full p-4 pb-9 border border-[#d1d5db] text-[15px] leading-relaxed resize-none focus:ring-0 focus:border-[#0f4c3a]"
                      value={form.content}
                      onChange={(event) => onChangeContent(event.target.value)}
                    />
                    <span className="absolute right-4 bottom-3 text-[13px] text-[#6b7280] tabular-nums">
                      {`${form.contentLength} / ${REVIEW_CONTENT_MAX}`}
                    </span>
                  </div>
                  {/* 쓰기 시작했는데 10자가 안 되면 빨간 글씨 (앞뒤 공백은 세지 않음) */}
                  <p
                    className={`text-[13px] ${form.contentTooShort ? 'text-[#b91c1c]' : 'text-[#6b7280]'}`}
                  >
                    10자 이상 300자 이하로 써 주세요
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={!form.canSubmit || form.submitting}
                    className={`w-full h-14 text-base font-bold ${form.canSubmit && !form.submitting ? 'bg-[#0f4c3a] text-white' : 'bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed'}`}
                    onClick={onSubmit}
                  >
                    {form.submitting ? '등록하는 중...' : '등록하기'}
                  </button>
                  <ActionErrorLine message={form.errorMessage} className="text-center" />
                  <p className="text-[13px] text-[#6b7280] text-center">
                    별점을 고르고 내용을 10 ~ 300자로 써 주세요 · 등록한 리뷰는 수정할 수 없고, 3일
                    안에만 삭제할 수 있어요
                  </p>
                </div>
              </>
            )}
          </section>
        ) : (
          // 이 주문에서 지금 쓸 수 있는 판매자가 없음 (시안에 없는 상태. 빈 상태 상자 모양을 따름)
          <section className="bg-white border border-[#e5e7eb] px-6 py-20 flex flex-col items-center text-center gap-3">
            <h2 className="text-xl font-bold text-[#111827]">
              지금 이 주문에 쓸 수 있는 리뷰가 없어요
            </h2>
            <p className="text-[15px] text-[#4b5563]">
              이미 작성했거나, 구매 확정 전이거나, 작성 기간(구매 확정 후 3일)이 지났어요.
            </p>
            <ActionErrorLine message={form.errorMessage} className="" />
            <Link
              to={orderTo}
              className="mt-3 h-12 px-6 flex items-center bg-[#0f4c3a] text-white text-[15px] font-bold"
            >
              주문 상세로 돌아가기
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

export default ReviewWriteView;
