import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getNotifications, readAllNotifications, readNotification } from '../../api/notificationApi';
import {
  DEFAULT_NOTIFICATION_TYPE,
  NOTIFICATION_BADGE_CLASS,
  NOTIFICATION_TYPE,
  getNotificationTarget,
} from '../../constants/notification';
import useAuth from '../../hooks/useAuth';
import useNotification from '../../hooks/useNotification';
import usePageTitle from '../../hooks/usePageTitle';
import NotificationView from './NotificationView';

const PAGE_SIZE = 20;

// 알림 API는 ApiResponse로 감싸지 않고 DTO를 그대로 반환
async function fetchPage(page, tab) {
  const params = { page, size: PAGE_SIZE };
  if (tab === 'unread') params.isRead = false;
  const response = await getNotifications(params);
  return response.data.data ?? response.data;
}

// "방금 전" · "3분 전" · "1시간 전" · "어제" · "10월 14일" (시안 06-6-1)
function formatNotificationTime(value) {
  const date = new Date(value);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  if (hours < 48) return '어제';
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function toViewItem(item) {
  const type = NOTIFICATION_TYPE[item.type] ?? DEFAULT_NOTIFICATION_TYPE;
  return {
    id: item.notificationId,
    raw: item,
    to: getNotificationTarget(item) ?? '/notifications',
    badge: type.badge,
    badgeClass: NOTIFICATION_BADGE_CLASS[type.badge],
    unread: !item.isRead,
    title: item.message,
    // TODO: 둘째 줄(상품명 · 보조 문구) 응답 필드가 없음 → 백엔드에 subMessage 같은 필드 요청 필요
    sub: item.itemSummary ?? '{상품명 · 보조 문구}',
    timeText: formatNotificationTime(item.createdAt),
  };
}

function NotificationPage() {
  usePageTitle('알림');
  const { isLoggedIn, isInitializing } = useAuth();
  const { unreadCount, setUnreadCount, refreshUnreadCount } = useNotification();

  const [tab, setTab] = useState('all'); // all | unread
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReadingAll, setIsReadingAll] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    fetchPage(0, tab)
      .then((data) => {
        if (ignore) return;
        setItems(data.content);
        setPage(0);
        setHasNext(data.totalPages > 1);
        setLoadState('done');
      })
      .catch(() => {
        if (!ignore) setLoadState('error');
      });
    // 화면을 열면 배지도 최신으로
    refreshUnreadCount();
    return () => {
      ignore = true;
    };
  }, [isLoggedIn, tab, refreshUnreadCount]);

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true);
    try {
      const data = await fetchPage(page + 1, tab);
      // 그 사이 새 알림이 생기면 페이지가 밀려 겹칠 수 있어 id로 중복 제거
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.notificationId));
        return [...prev, ...data.content.filter((item) => !seen.has(item.notificationId))];
      });
      setPage(page + 1);
      setHasNext(page + 2 < data.totalPages);
    } catch {
      // 다음에 다시 내리면 다시 시도
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, tab]);

  // 목록 아래 안내 문구가 보이면 다음 페이지를 불러옴
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasNext || isLoadingMore) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNext, isLoadingMore, loadMore, items.length]);

  const handleTabChange = (next) => {
    if (next === tab) return;
    setLoadState('loading');
    setItems([]);
    setTab(next);
  };

  // 누르면 읽음 처리 (Link가 관련 화면으로 이동시킴). 실패해도 이동은 함
  const handleOpen = (viewItem) => {
    if (!viewItem.unread) return;
    readNotification(viewItem.id)
      .then(() => setUnreadCount((count) => Math.max(0, count - 1)))
      .catch(() => {});
  };

  const handleReadAll = async () => {
    setIsReadingAll(true);
    try {
      await readAllNotifications();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      refreshUnreadCount();
    } finally {
      setIsReadingAll(false);
    }
  };

  if (isInitializing) return <main className="flex-1" />;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/notifications' }} />;

  return (
    <NotificationView
      tab={tab}
      onTabChange={handleTabChange}
      unreadCount={unreadCount}
      onReadAll={handleReadAll}
      isReadingAll={isReadingAll}
      items={items.map(toViewItem)}
      onOpen={handleOpen}
      loadState={loadState}
      sentinelRef={sentinelRef}
      isLoadingMore={isLoadingMore}
    />
  );
}

export default NotificationPage;
