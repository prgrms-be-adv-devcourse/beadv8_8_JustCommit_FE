import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format';

// 시안 03-4 주문 목록 (Orders · OrdersEmpty)
// 데이터는 모두 props로 받음 → 페이지(OrderListPage)가 API를 부르고 화면용 모양(card)으로 바꿔 넘김

// 상태 배지 색
const BADGE_TONE = {
  pending: 'bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]', // 결제 대기
  amber: 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]', // 판매자 확인 중
  green: 'bg-[#f4f8f6] border-[#d1e7dd] text-[#0f4c3a]', // 픽업 대기 · 배송 중 · 배송 완료
  dark: 'bg-[#0f4c3a] border-[#0f4c3a] text-white', // 구매 확정
  gray: 'bg-[#f3f4f6] border-[#f3f4f6] text-[#6b7280]', // 결제 시간 만료 · 판매자 거절 · 자동 취소
};

function Badge({ badge }) {
  return (
    <span className={`h-7 px-2.5 flex items-center border text-[13px] font-semibold shrink-0 ${BADGE_TONE[badge.tone]}`}>
      {badge.label}
    </span>
  );
}

// 판매자 주문 한 줄 아래 안내
// note = { text, tone: 'amber' | 'gray', strong? (앞에 굵게 붙는 말, 예: 일부 취소 1건) }
function RowNote({ note }) {
  if (note.strong) {
    return (
      <p className="text-[13px] text-[#6b7280]">
        <span className="font-semibold text-[#4b5563]">{note.strong}</span>
        {` · ${note.text}`}
      </p>
    );
  }
  return <p className={`text-[13px] ${note.tone === 'amber' ? 'text-[#92400e]' : 'text-[#6b7280]'}`}>{note.text}</p>;
}

// row = { key, sellerText, itemName, moreCount, thumbnailUrl, muted, note?, badge? }
function OrderRow({ row }) {
  return (
    <div className="px-5 py-4 flex items-center gap-4">
      <img
        src={row.thumbnailUrl}
        alt={row.itemName}
        className={`w-[72px] h-[72px] object-cover border border-[#e5e7eb] shrink-0${row.muted ? ' grayscale opacity-60' : ''}`}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-[13px] text-[#6b7280]">{row.sellerText}</p>
        <p className="text-[15px] font-medium text-[#111827] truncate">
          {row.itemName}
          {row.moreCount > 0 && (
            <>
              {' '}
              <span className="text-[#6b7280] font-normal">{`외 ${row.moreCount}건`}</span>
            </>
          )}
        </p>
        {row.note && <RowNote note={row.note} />}
      </div>
      {row.badge && <Badge badge={row.badge} />}
    </div>
  );
}

const VISIBLE_ROWS = 2; // 판매자가 많으면 2곳만 보이고 "더 보기"

// card = { orderId, dateText, orderNo, headerBadge?, headerText?, rows[], totalAmount,
//          footerNote?: { text, tone: 'red' | 'gray' }, payTo? (결제 대기면 이어서 결제할 주소) }
function OrderCard({ card, expanded, onExpand }) {
  const rows = expanded ? card.rows : card.rows.slice(0, VISIBLE_ROWS);
  const hiddenCount = card.rows.length - rows.length;
  return (
    <li className="bg-white border border-[#e5e7eb]">
      <div className="px-5 py-3 border-b border-[#f3f4f6] flex items-center gap-4">
        <span className="text-[15px] font-bold text-[#111827]">{card.dateText}</span>
        <span className="text-[13px] text-[#6b7280] tabular-nums tracking-tight">{`주문 번호 ${card.orderNo}`}</span>
        <span className="ml-auto flex items-center">
          {card.headerBadge && <Badge badge={card.headerBadge} />}
          {card.headerText && <span className="text-[13px] text-[#6b7280]">{card.headerText}</span>}
        </span>
      </div>
      <div className="divide-y divide-[#f3f4f6]">
        {rows.map((row) => (
          <OrderRow key={row.key} row={row} />
        ))}
        {hiddenCount > 0 && (
          <button
            type="button"
            className="w-full h-11 flex items-center justify-center gap-1 text-[13px] font-medium text-[#4b5563]"
            onClick={() => onExpand(card.orderId)}
          >
            {`판매자 ${hiddenCount}곳 더 보기`}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
      <div className="px-5 py-3 border-t border-[#f3f4f6] bg-[#f9fafb] flex items-center gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-[13px] text-[#6b7280]">
            결제 금액 <strong className="ml-1 text-[17px] font-bold text-[#111827]">{formatPrice(card.totalAmount)}</strong>
          </p>
          {card.footerNote?.tone === 'red' && (
            <p className="flex items-center gap-1.5 text-[13px] text-[#b91c1c] font-medium">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {card.footerNote.text}
            </p>
          )}
          {card.footerNote?.tone === 'gray' && <p className="text-[13px] text-[#6b7280]">{card.footerNote.text}</p>}
        </div>
        {card.payTo ? (
          <Link
            to={card.payTo}
            className="h-10 px-5 flex items-center justify-center bg-[#0f4c3a] text-white text-sm font-bold shrink-0"
          >
            이어서 결제하기
          </Link>
        ) : (
          // 주문 상세(03-5)는 다른 화면 갈래가 맡음 → 여기서는 링크만
          <Link
            to={`/orders/${card.orderId}`}
            className="flex items-center gap-0.5 text-sm font-semibold text-[#0f4c3a] shrink-0"
          >
            주문 상세
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </li>
  );
}

// tabs = [{ value, label, count }]
function OrderListView({ tabs, selectedTab, cards, expandedIds = [], message, onSelectTab, onExpand }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-8 pb-16">
      <div className="max-w-[960px] mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">주문 목록</h1>
        <div role="tablist" aria-label="주문 상태" className="flex border-b border-[#e5e7eb]">
          {tabs.map((tab) => {
            const selected = tab.value === selectedTab;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`h-12 px-4 -mb-px flex items-center gap-1.5 border-b-2 text-[15px] ${selected ? 'border-[#0f4c3a] text-[#0f4c3a] font-bold' : 'border-transparent text-[#6b7280] font-medium'}`}
                onClick={() => onSelectTab(tab.value)}
              >
                {tab.label}
                {tab.count != null && (
                  <span
                    className={`min-w-[22px] h-[22px] px-1.5 flex items-center justify-center text-xs font-semibold ${selected ? 'bg-[#0f4c3a] text-white' : 'bg-[#f3f4f6] text-[#4b5563]'}`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {message && <p className="py-24 text-center text-[15px] text-[#4b5563]">{message}</p>}

        {!message && cards.length === 0 && (
          <div className="bg-white border border-[#e5e7eb] px-6 py-24 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 bg-[#f4f8f6] border border-[#d1e7dd] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#0f4c3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h2 className="mt-2 text-xl font-bold text-[#111827]">아직 주문한 식물이 없어요</h2>
            <p className="text-[15px] text-[#4b5563]">마음에 드는 식물을 찾아 첫 주문을 해 보세요.</p>
            <Link to="/" className="mt-3 h-12 px-6 flex items-center justify-center bg-[#0f4c3a] text-white text-[15px] font-bold">
              식물 둘러보기
            </Link>
          </div>
        )}

        {cards.length > 0 && (
          <ul className="space-y-4">
            {cards.map((card) => (
              <OrderCard
                key={card.orderId}
                card={card}
                expanded={expandedIds.includes(card.orderId)}
                onExpand={onExpand}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

export default OrderListView;
