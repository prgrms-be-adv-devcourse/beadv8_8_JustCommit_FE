import { ActionErrorLine } from '../../components/common/ActionError';
import { QuotaBar } from '../../components/seller/SellerParts';
import PageBackLink from '../../components/common/PageBackLink';
import InfoNote from '../../components/common/InfoNote';
import { SELLER_PRODUCT_BADGE } from '../../constants/seller';

export const MAX_PHOTOS = 10;

// 시안 08-2-1 상품 등록 · 08-2-2 상품 수정 (화면만, 데이터는 props)
// isEdit: 수정 모드 (제목 · 지금 상태 · 안내 · 버튼 문구가 바뀜)
// quota: 등록 모드의 등록 제한 줄 / status: 수정 모드의 지금 상태
// photos = [{ id, previewUrl }] / species: 품종 입력(검색어 · 목록) props 묶음
function ProductFormView({
  isEdit,
  quota,
  status,
  photos,
  photoHandlers,
  species,
  title,
  onTitleChange,
  priceText,
  onPriceChange,
  description,
  onDescriptionChange,
  canSubmit,
  isSubmitting,
  errorMessage,
  onCancel,
  onSubmit,
}) {
  const badge = SELLER_PRODUCT_BADGE[status];
  let submitLabel = isEdit ? '수정하기' : '등록하기';
  if (isSubmitting) submitLabel = isEdit ? '수정 중...' : '등록 중...';

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[760px] mx-auto space-y-6">
        <PageBackLink to="/mypage/products" label="내 판매 목록" />
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">{isEdit ? '상품 수정' : '상품 등록'}</h1>
        {isEdit ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#4b5563]">지금 상태</span>
            {badge && <span className={`h-7 px-2.5 flex items-center text-xs font-semibold ${badge.tone}`}>{badge.label}</span>}
          </div>
        ) : (
          <QuotaBar quota={quota} />
        )}
        <form className="bg-white border border-[#e5e7eb] p-8 space-y-7" onSubmit={onSubmit}>
          <div className="space-y-2">
            <span className="text-sm font-bold text-[#111827]">
              사진 <span className="text-[#b91c1c]">*</span>
            </span>
            <div className="flex flex-wrap gap-3">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative w-[104px] h-[104px] shrink-0 border border-[#e5e7eb] overflow-hidden"
                  draggable={!isSubmitting}
                  onDragStart={() => photoHandlers.onDragStart(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => photoHandlers.onDrop(index)}
                  onDragEnd={photoHandlers.onDragEnd}
                >
                  <img src={photo.previewUrl} alt={`상품 사진 ${index + 1}`} className="w-full h-full object-cover object-center" />
                  {index === 0 && (
                    <span className="absolute left-0 top-0 h-6 px-2 flex items-center bg-[#0f4c3a] text-white text-xs font-semibold">
                      대표
                    </span>
                  )}
                  <button
                    type="button"
                    className="absolute right-1 top-1 w-6 h-6 flex items-center justify-center bg-black/60 text-white"
                    aria-label={`사진 ${index + 1} 삭제`}
                    onClick={() => photoHandlers.onRemove(photo.id)}
                    disabled={isSubmitting}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  className="w-[104px] h-[104px] border border-dashed border-[#9ca3af] flex flex-col items-center justify-center gap-1 text-[#4b5563]"
                  onClick={photoHandlers.onAdd}
                  disabled={isSubmitting}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-medium tabular-nums">{`사진 추가 ${photos.length}/${MAX_PHOTOS}`}</span>
                </button>
              )}
            </div>
            <p className="text-[13px] text-[#6b7280]">
              첫 번째 사진이 대표 사진이 돼요. 끌어서 순서를 바꿀 수 있어요. JPEG · PNG, 한 장에 10MB 이하, 1~10장
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="pf-species" className="text-sm font-bold text-[#111827]">
              품종 <span className="text-[#b91c1c]">*</span>
            </label>
            <div className="relative">
              <div className="w-full h-12 px-4 border border-[#d1d5db] text-[15px] text-[#111827] focus:ring-0 focus:border-[#0f4c3a] flex items-center justify-between">
                <input
                  id="pf-species"
                  type="text"
                  role="combobox"
                  aria-expanded={species.isOpen}
                  aria-controls="pf-species-list"
                  aria-autocomplete="list"
                  autoComplete="off"
                  placeholder="품종을 검색해 주세요"
                  className="flex-1 min-w-0 p-0 border-0 bg-transparent text-[15px] text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-0"
                  value={species.query}
                  onChange={species.onChange}
                  onFocus={species.onOpen}
                  onBlur={species.onClose}
                  onKeyDown={species.onKeyDown}
                  disabled={isSubmitting}
                />
                <svg className="w-5 h-5 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {species.isOpen && species.options.length > 0 && (
                <ul
                  id="pf-species-list"
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-20 max-h-[264px] overflow-y-auto bg-white border border-t-0 border-[#d1d5db] shadow-lg"
                >
                  {species.options.map((option, index) => (
                    <li
                      key={option.speciesId}
                      role="option"
                      aria-selected={index === species.activeIndex}
                      className={`h-11 px-4 flex items-center text-[15px] text-[#111827] cursor-pointer ${
                        index === species.activeIndex ? 'bg-[#f4f8f6]' : 'bg-white'
                      }`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => species.onSelect(option)}
                    >
                      {option.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-[13px] text-[#6b7280]">목록에 없는 식물이면 "기타"를 골라 주세요. 관리자가 확인해요.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="pf-title" className="text-sm font-bold text-[#111827]">
              상품명 <span className="text-[#b91c1c]">*</span>
            </label>
            <input
              id="pf-title"
              type="text"
              placeholder="예) 알로카시아 프라이덱 (40cm, 잎 6장)"
              className="w-full h-12 px-4 border border-[#d1d5db] text-[15px] text-[#111827] focus:ring-0 focus:border-[#0f4c3a]"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              maxLength={100}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="pf-price" className="text-sm font-bold text-[#111827]">
              가격 <span className="text-[#b91c1c]">*</span>
            </label>
            <div className="h-12 px-4 border border-[#d1d5db] flex items-center gap-2">
              <input
                id="pf-price"
                type="text"
                inputMode="numeric"
                placeholder="0"
                className="flex-1 min-w-0 border-0 p-0 focus:ring-0 text-right text-[15px] font-semibold text-[#111827] bg-transparent"
                value={priceText}
                onChange={(event) => onPriceChange(event.target.value)}
                disabled={isSubmitting}
              />
              <span className="text-[15px] text-[#4b5563]">원</span>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="pf-description" className="text-sm font-bold text-[#111827]">
              설명 <span className="text-[#b91c1c]">*</span>
            </label>
            <textarea
              id="pf-description"
              rows="5"
              placeholder="키운 기간, 크기, 잎 상태, 화분 등 식물의 상태를 자세히 적어 주세요."
              className="w-full p-4 border border-[#d1d5db] text-[15px] leading-relaxed resize-none focus:ring-0 focus:border-[#0f4c3a]"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="p-4 bg-[#f9fafb] border border-[#e5e7eb] space-y-1.5 text-[13px] text-[#4b5563] leading-relaxed">
            <p className="font-bold text-[#111827]">식물 1개체당 판매글 1개만 등록돼요</p>
            <p>
              씨앗 · 삽수 · 구근처럼 심지 않은 식물과 멸종위기 야생생물 · 마약류 원료 식물 · 생태계교란 생물은 인공증식한
              개체도 팔 수 없어요.
            </p>
          </div>
          <InfoNote>
            {isEdit
              ? '사진을 바꾸면 사진 검수를 처음부터 다시 받아요. 글만 바꾸면 글만 다시 검사하고, 판매 중이어도 걸리면 반려돼요.'
              : '등록하면 사진 검수를 받아요. 통과하면 바로 판매가 시작되고, 결과는 알림으로도 알려 드려요.'}
          </InfoNote>
          <div>
            <div className="flex gap-2">
              <button
                type="button"
                className="h-14 w-[120px] bg-white border border-[#d1d5db] text-[15px] font-semibold text-[#111827] shrink-0"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 h-14 bg-[#0f4c3a] text-white text-base font-bold disabled:opacity-50"
                disabled={!canSubmit}
              >
                {submitLabel}
              </button>
            </div>
            <ActionErrorLine message={errorMessage} />
          </div>
        </form>
      </div>
    </main>
  );
}

export default ProductFormView;
