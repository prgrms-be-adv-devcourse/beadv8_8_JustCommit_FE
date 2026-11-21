import UnderlineTab from '../common/UnderlineTab';

// 판매자 화면(캔버스 08 · 04 판매 주문 상세)에서 반복되는 시안 조각

// 숫자 배지가 붙은 탭 줄 (내 판매 목록 · 판매 주문)
// tabs = [{ value, label, count }]
export function CountTabs({ tabs, value, onChange }) {
  return (
    <div className="flex border-b border-[#e5e7eb]" role="tablist">
      {tabs.map((tab) => (
        <UnderlineTab
          key={tab.value || 'all'}
          compact
          role="tab"
          aria-selected={tab.value === value}
          active={tab.value === value}
          count={tab.count}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </UnderlineTab>
      ))}
    </div>
  );
}

// 등록 제한 줄: 검수 중 · 오늘 등록 · 오늘 사진 검수
// quota = { reviewing, registeredToday, reviewedToday } (값은 "3 / 5개"처럼 완성된 문자열)
export function QuotaBar({ quota }) {
  return (
    <div className="px-5 py-3 bg-[#f9fafb] border border-[#e5e7eb] flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[#4b5563]">
      <span className="whitespace-nowrap">
        검수 중 <b className="text-[#111827] tabular-nums">{quota.reviewing}</b>
      </span>
      <span className="hidden sm:block w-px h-4 bg-[#e5e7eb]"></span>
      <span className="whitespace-nowrap">
        오늘 등록 <b className="text-[#111827] tabular-nums">{quota.registeredToday}</b>
      </span>
      <span className="hidden sm:block w-px h-4 bg-[#e5e7eb]"></span>
      <span className="whitespace-nowrap">
        오늘 사진 검수 <b className="text-[#111827] tabular-nums">{quota.reviewedToday}</b>
      </span>
    </div>
  );
}
