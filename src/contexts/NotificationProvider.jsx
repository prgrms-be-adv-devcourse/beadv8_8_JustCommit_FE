import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getNotifications, getUnreadNotificationCount } from '../api/notificationApi';
import { subscribeSse } from '../api/sse';
import useAuth from '../hooks/useAuth';
import useWallet from '../hooks/useWallet';
import { NotificationContext } from './NotificationContext';

const SUBSCRIBE_PATH = '/api/v1/notifications/subscribe';

// 판매자 정산과 같은 순간에 오는 알림 (구매 확정 → 정산 입금)
const SETTLEMENT_NOTIFICATION_TYPE = 'PURCHASE_CONFIRMED';

// 알림과 정산은 같은 이벤트를 따로 처리해서, 알림이 아주 조금 먼저 올 수 있음 → 잠시 뒤 잔액 조회
const WALLET_REFRESH_DELAY_MS = 1000;

// 알림 API는 ApiResponse로 감싸지 않고 DTO를 그대로 반환
function unwrap(response) {
  return response.data.data ?? response.data;
}

// 안 읽은 수 조회. 실패하면 null (배지는 보조 정보라 화면을 막지 않음)
async function fetchUnreadCount() {
  try {
    return unwrap(await getUnreadNotificationCount()).count ?? 0;
  } catch {
    return null;
  }
}

// 최근 안 읽은 알림 (새로 온 알림 종류 확인용)
async function fetchRecentUnread() {
  try {
    return unwrap(await getNotifications({ page: 0, size: 10, isRead: false })).content ?? [];
  } catch {
    return [];
  }
}

// 안 읽은 알림 수 공유 (헤더 배지·알림 화면에서 같은 값 사용)
// 서버 SSE가 알림이 생길 때마다 "unread" 이벤트로 개수를 보내 주고, 연결 직후에도 현재 개수를 보냄
export function NotificationProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const { refreshWallet } = useWallet();
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCountRef = useRef(null); // 직전에 받은 개수 (늘었는지 비교)
  const seenSettlementIdsRef = useRef(new Set()); // 이미 잔액을 갱신한 정산 알림

  // 읽음 처리 후 등 화면에서 직접 호출해 배지 갱신
  const refreshUnreadCount = useCallback(async () => {
    const count = await fetchUnreadCount();
    if (count !== null) setUnreadCount(count);
  }, []);

  // 개수가 늘었을 때만: 새 알림 중 정산 알림이 있으면 예치금을 다시 조회
  const handleNewNotifications = useCallback(async () => {
    const recent = await fetchRecentUnread();
    const settlements = recent.filter(
      (item) =>
        item.type === SETTLEMENT_NOTIFICATION_TYPE &&
        !seenSettlementIdsRef.current.has(item.notificationId),
    );
    if (settlements.length === 0) return;
    settlements.forEach((item) => seenSettlementIdsRef.current.add(item.notificationId));
    setTimeout(() => {
      refreshWallet().catch(() => {});
    }, WALLET_REFRESH_DELAY_MS);
  }, [refreshWallet]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;

    lastCountRef.current = null;
    const close = subscribeSse(SUBSCRIBE_PATH, ({ name, data }) => {
      if (name !== 'unread') return;
      const count = Number(data);
      if (!Number.isFinite(count)) return;

      const previous = lastCountRef.current;
      lastCountRef.current = count;
      setUnreadCount(count);
      // 첫 값(연결 직후)은 비교 대상이 없어서 넘어감
      if (previous !== null && count > previous) handleNewNotifications();
    });

    return close;
  }, [isLoggedIn, handleNewNotifications]);

  // 로그아웃 상태면 이전 개수를 보여 주지 않음
  const visibleCount = isLoggedIn ? unreadCount : 0;

  const value = useMemo(
    () => ({ unreadCount: visibleCount, setUnreadCount, refreshUnreadCount }),
    [visibleCount, refreshUnreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
