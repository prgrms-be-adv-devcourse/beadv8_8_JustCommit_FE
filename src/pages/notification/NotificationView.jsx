import { Link } from 'react-router-dom';
import DesignBackLink from '../../components/mypage/DesignBackLink';
import TabButton from '../../components/mypage/TabButton';

// 시안 06-6-1 알림 · 06-6-2 알림 없음
// props
//   tab('all'|'unread'), onTabChange, unreadCount, onReadAll, isReadingAll
//   items = [{ id, to, badge, badgeClass, unread, title, sub, timeText }]
//   onOpen(item), loadState('loading'|'done'|'error'), sentinelRef(더 불러오기 감지용), isLoadingMore

function NotificationItem({ item, onOpen }) {
  return (
    <li className="border-t border-[#e5e7eb] first:border-t-0">
      <Link
        to={item.to}
        onClick={() => onOpen(item)}
        className={`px-6 py-4 flex items-center gap-4 ${item.unread ? 'bg-[#f4f8f6]' : 'bg-white'}`}
      >
        <span className={item.unread ? 'w-2 h-2 bg-[#0f4c3a] shrink-0' : 'w-2 h-2 shrink-0'} />
        <span className={`h-6 w-[44px] flex items-center justify-center text-xs font-semibold shrink-0 ${item.badgeClass}`}>
          {item.badge}
        </span>
        <span className="flex-1 min-w-0 space-y-1">
          <span className={`block text-[15px] ${item.unread ? 'font-bold' : 'font-medium'} text-[#111827]`}>{item.title}</span>
          <span className="block text-[13px] text-[#4b5563]">{item.sub}</span>
        </span>
        <span className="text-[13px] text-[#6b7280] whitespace-nowrap tabular-nums">{item.timeText}</span>
        <svg className="w-5 h-5 text-[#9ca3af] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </li>
  );
}

function EmptyBox({ tab }) {
  return (
    <div className="bg-white border border-[#e5e7eb] px-6 py-24 flex flex-col items-center text-center gap-3">
      <div className="w-16 h-16 bg-[#f4f8f6] border border-[#d1e7dd] flex items-center justify-center">
        <svg className="w-8 h-8 text-[#0f4c3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </div>
      <h2 className="mt-2 text-xl font-bold text-[#111827]">
        {tab === 'unread' ? '안 읽은 알림이 없어요' : '아직 받은 알림이 없어요'}
      </h2>
      <p className="text-[15px] text-[#4b5563]">주문 · 배송 · 정산 소식이 생기면 여기에서 알려 드려요.</p>
    </div>
  );
}

function NotificationView({
  tab,
  onTabChange,
  unreadCount,
  onReadAll,
  isReadingAll,
  items,
  onOpen,
  loadState,
  sentinelRef,
  isLoadingMore,
}) {
  const canReadAll = unreadCount > 0 && !isReadingAll;

  const renderBody = () => {
    if (loadState === 'loading') return <p className="text-sm text-[#6b7280]">알림을 불러오는 중...</p>;
    if (loadState === 'error') {
      return (
        <p className="text-sm text-[#6b7280]" role="alert">
          알림을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      );
    }
    if (items.length === 0) return <EmptyBox tab={tab} />;
    return (
      <>
        <ul className="bg-white border border-[#e5e7eb]">
          {items.map((item) => (
            <NotificationItem key={item.id} item={item} onOpen={onOpen} />
          ))}
        </ul>
        <p ref={sentinelRef} className="text-center text-[13px] text-[#6b7280]">
          {isLoadingMore ? '이전 알림을 불러오는 중...' : '알림은 지우지 않고 보관돼요. 아래로 내리면 이전 알림을 더 불러와요.'}
        </p>
      </>
    );
  };

  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 pt-6 pb-16">
      <div className="max-w-[880px] mx-auto space-y-6">
        <DesignBackLink to="/mypage" label="마이페이지" />
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">알림</h1>
        <div className="flex items-end justify-between border-b border-[#e5e7eb]">
          <div className="flex">
            <TabButton active={tab === 'all'} onClick={() => onTabChange('all')}>
              전체
            </TabButton>
            <UnreadTab active={tab === 'unread'} count={unreadCount} onClick={() => onTabChange('unread')} />
          </div>
          <div className="pb-2">
            {canReadAll ? (
              <button
                type="button"
                className="h-9 w-[88px] bg-white border border-[#d1d5db] text-sm font-semibold text-[#111827]"
                onClick={onReadAll}
              >
                모두 읽음
              </button>
            ) : (
              <button type="button" disabled className="h-9 w-[88px] bg-[#f3f4f6] text-sm font-semibold text-[#9ca3af] cursor-not-allowed">
                모두 읽음
              </button>
            )}
          </div>
        </div>
        {renderBody()}
      </div>
    </main>
  );
}

// 안 읽음 탭: 시안에서 숫자 칩이 탭 상태와 상관없이 회색
function UnreadTab({ active, count, onClick }) {
  const tabClass = active ? 'border-[#0f4c3a] text-[#0f4c3a] font-bold' : 'border-transparent text-[#6b7280] font-medium';
  return (
    <button
      type="button"
      className={`h-12 px-4 -mb-px flex items-center gap-1.5 border-b-2 text-[15px] ${tabClass}`}
      onClick={onClick}
      aria-pressed={active}
    >
      안 읽음
      <span className="min-w-[22px] h-[22px] px-1.5 flex items-center justify-center text-xs font-semibold bg-[#f3f4f6] text-[#4b5563]">
        {count}
      </span>
    </button>
  );
}

export default NotificationView;
