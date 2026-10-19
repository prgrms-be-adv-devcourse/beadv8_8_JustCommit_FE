import { useCallback, useEffect, useMemo, useState } from 'react';
import { getUnreadNotificationCount } from '../api/notificationApi';
import { UNREAD_POLL_INTERVAL_MS } from '../constants/notification';
import useAuth from '../hooks/useAuth';
import { NotificationContext } from './NotificationContext';

// 안 읽은 수 조회. 실패하면 null (배지는 보조 정보라 화면을 막지 않고 다음 주기에 다시 시도)
async function fetchUnreadCount() {
  try {
    const response = await getUnreadNotificationCount();
    const data = response.data.data ?? response.data; // 알림 API는 DTO를 그대로 반환
    return data.count ?? 0;
  } catch {
    return null;
  }
}

// 안 읽은 알림 수 공유 (헤더 배지·알림 화면에서 같은 값 사용)
// TODO: 실시간 SSE(/api/v1/notifications/subscribe)로 바꾸면 주기 조회를 없앤다.
//       브라우저 EventSource는 Authorization 헤더를 못 붙여서 fetch 기반 연결이 필요함
export function NotificationProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // 읽음 처리 후 등 화면에서 직접 호출해 배지 갱신
  const refreshUnreadCount = useCallback(async () => {
    const count = await fetchUnreadCount();
    if (count !== null) setUnreadCount(count);
  }, []);

  // 로그인 중에는 바로 한 번 + 일정 간격으로 조회. 탭이 다시 보이면 즉시 조회
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    let ignore = false;
    const load = () =>
      fetchUnreadCount().then((count) => {
        if (!ignore && count !== null) setUnreadCount(count);
      });

    load();
    const timer = setInterval(load, UNREAD_POLL_INTERVAL_MS);
    const handleVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      ignore = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [isLoggedIn]);

  // 로그아웃 상태면 이전 개수를 보여 주지 않음
  const visibleCount = isLoggedIn ? unreadCount : 0;

  const value = useMemo(
    () => ({ unreadCount: visibleCount, setUnreadCount, refreshUnreadCount }),
    [visibleCount, refreshUnreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
