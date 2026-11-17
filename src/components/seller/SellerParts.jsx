import { Link } from 'react-router-dom';

// 판매자 화면(캔버스 08 · 04 판매 주문 상세)에서 반복되는 시안 조각

// 화면 맨 위 「‹ 이전 화면」 링크
export function PageBackLink({ to, label }) {
  return (
    <Link to={to} className="h-11 inline-flex items-center gap-1.5 text-sm font-medium text-[#4b5563]">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}

// ⓘ 아이콘 + 안내 한 줄
export function InfoNote({ children }) {
  return (
    <p className="flex gap-1.5 text-[13px] text-[#4b5563] leading-relaxed">
      <svg className="w-4 h-4 text-[#9ca3af] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{children}</span>
    </p>
  );
}

// 숫자 배지가 붙은 탭 줄 (내 판매 목록 · 판매 주문)
// tabs = [{ value, label, count }]
export function CountTabs({ tabs, value, onChange }) {
  return (
    <div className="flex border-b border-[#e5e7eb]" role="tablist">
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value || 'all'}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`h-12 px-3.5 -mb-px flex items-center gap-1.5 border-b-2 text-[15px] whitespace-nowrap ${
              selected ? 'border-[#0f4c3a] text-[#0f4c3a] font-bold' : 'border-transparent text-[#6b7280] font-medium'
            }`}
          >
            {tab.label}
            <span
              className={`min-w-[22px] h-[22px] px-1.5 flex items-center justify-center text-xs font-semibold ${
                selected ? 'bg-[#0f4c3a] text-white' : 'bg-[#f3f4f6] text-[#4b5563]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// 등록 제한 줄: 검수 중 · 오늘 등록 · 오늘 사진 검수
// quota = { reviewing, registeredToday, reviewedToday } (값은 "3 / 5개"처럼 완성된 문자열)
export function QuotaBar({ quota }) {
  return (
    <div className="px-5 py-3 bg-[#f9fafb] border border-[#e5e7eb] flex items-center gap-6 text-sm text-[#4b5563]">
      <span>
        검수 중 <b className="text-[#111827] tabular-nums">{quota.reviewing}</b>
      </span>
      <span className="w-px h-4 bg-[#e5e7eb]"></span>
      <span>
        오늘 등록 <b className="text-[#111827] tabular-nums">{quota.registeredToday}</b>
      </span>
      <span className="w-px h-4 bg-[#e5e7eb]"></span>
      <span>
        오늘 사진 검수 <b className="text-[#111827] tabular-nums">{quota.reviewedToday}</b>
      </span>
    </div>
  );
}
