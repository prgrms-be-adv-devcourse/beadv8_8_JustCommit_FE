// 판매자가 받은 리뷰 태그 칩 「태그 + 개수」 (시안 02-3-1 상점 · 02-3-2 판매 중 없음 「최근 리뷰」 칸, 02-3-3 리뷰 전체)
// tags = [{ label, count }] (많은 순, 최대 5개). 비었으면 아무것도 그리지 않음 (02-3-4 리뷰 없음)
function SellerTagChips({ tags, className = '' }) {
  if (!tags?.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5${className ? ` ${className}` : ''}`}>
      {tags.map((tag) => (
        <span
          key={tag.label}
          className="h-7 px-2.5 flex items-center gap-1 bg-[#f4f8f6] border border-[#d1e7dd] text-[13px] text-[#0f4c3a]"
        >
          {tag.label}
          <b className="font-semibold tabular-nums">{tag.count.toLocaleString('ko-KR')}</b>
        </span>
      ))}
    </div>
  );
}

export default SellerTagChips;
