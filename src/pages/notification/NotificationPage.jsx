import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  getNotifications,
  readAllNotifications,
  readNotification,
} from '../../api/notificationApi';
import {
  DEFAULT_NOTIFICATION_TYPE,
  NOTIFICATION_TYPE,
  getNotificationTarget,
} from '../../constants/notification';
import useAuth from '../../hooks/useAuth';
import useNotification from '../../hooks/useNotification';
import usePageTitle from '../../hooks/usePageTitle';
import { formatRelativeTime } from '../../utils/format';
import styles from './NotificationPage.module.css';

const PAGE_SIZE = 20;

// 주문 번호(ORD-…)는 길고 무작위라 앞부분만 보여 주고, 전체는 마우스를 올리면 보임
const ORDER_NO_PREVIEW_LENGTH = 10;

function shortOrderNo(orderNo) {
  return orderNo.length > ORDER_NO_PREVIEW_LENGTH
    ? `${orderNo.slice(0, ORDER_NO_PREVIEW_LENGTH)}…`
    : orderNo;
}

// 알림 API는 ApiResponse로 감싸지 않고 DTO를 그대로 반환
async function fetchPage(page) {
  const response = await getNotifications({ page, size: PAGE_SIZE });
  return response.data.data ?? response.data;
}

function NotificationPage() {
  usePageTitle('알림');
  const navigate = useNavigate();
  const { isLoggedIn, isInitializing } = useAuth();
  const { setUnreadCount, refreshUnreadCount } = useNotification();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReadingAll, setIsReadingAll] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return undefined;

    let ignore = false;
    fetchPage(0)
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
  }, [isLoggedIn, refreshUnreadCount]);

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      const data = await fetchPage(page + 1);
      // 그 사이 새 알림이 생기면 페이지가 밀려 겹칠 수 있어 id로 중복 제거
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.notificationId));
        return [...prev, ...data.content.filter((item) => !seen.has(item.notificationId))];
      });
      setPage(page + 1);
      setHasNext(page + 2 < data.totalPages);
    } catch {
      // 버튼이 그대로 남아 있어 다시 누르면 됨
    } finally {
      setIsLoadingMore(false);
    }
  };

  const markReadLocally = useCallback(
    (notificationId) => {
      setItems((prev) =>
        prev.map((item) =>
          item.notificationId === notificationId ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    },
    [setUnreadCount],
  );

  // 누르면 읽음 처리 후 관련 화면으로 이동. 읽음 요청이 실패해도 이동은 한다
  const handleOpen = async (item) => {
    if (!item.isRead) {
      try {
        await readNotification(item.notificationId);
        markReadLocally(item.notificationId);
      } catch {
        // 다음에 목록을 다시 열면 안 읽음으로 남아 있음
      }
    }
    const target = getNotificationTarget(item);
    if (target) navigate(target);
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

  if (isInitializing) {
    return <p className={styles.message}>불러오는 중...</p>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/notifications' }} />;
  }

  const hasUnread = items.some((item) => !item.isRead);

  const renderBody = () => {
    if (loadState === 'loading') {
      return <p className={styles.message}>알림을 불러오는 중...</p>;
    }
    if (loadState === 'error') {
      return (
        <p className={styles.message}>알림을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      );
    }
    if (items.length === 0) {
      return (
        <div className={styles.empty}>
          <span className={`material-symbols-outlined ${styles.emptyIcon}`} aria-hidden="true">
            notifications
          </span>
          <h2 className={styles.emptyTitle}>새 알림이 없어요</h2>
          <p className={styles.emptyText}>주문·배송·정산 소식이 생기면 여기에서 알려 드려요.</p>
        </div>
      );
    }

    return (
      <>
        <ul className={styles.list}>
          {items.map((item) => {
            const type = NOTIFICATION_TYPE[item.type] ?? DEFAULT_NOTIFICATION_TYPE;
            // 상품명이 있으면 제목으로 크게, 알림 문구는 그 아래 (같은 문구의 알림을 상품으로 구분)
            const hasTitle = Boolean(item.itemSummary);
            return (
              <li key={item.notificationId}>
                <button
                  type="button"
                  className={`${styles.item} ${item.isRead ? '' : styles.unread}`}
                  onClick={() => handleOpen(item)}
                >
                  <span className={styles.dot} aria-hidden="true" />
                  <span className={`material-symbols-outlined ${styles.icon}`} aria-hidden="true">
                    {type.icon}
                  </span>
                  <span className={styles.body}>
                    <span className={styles.kind}>
                      {type.kind}
                      {!item.isRead && <span className={styles.srOnly}> 안 읽음</span>}
                    </span>
                    {hasTitle && <span className={styles.title}>{item.itemSummary}</span>}
                    <span className={hasTitle ? styles.subText : styles.text}>{item.message}</span>
                  </span>
                  <span className={styles.side}>
                    <span className={styles.time}>{formatRelativeTime(item.createdAt)}</span>
                    {item.orderNo && (
                      <span className={styles.orderNo} title={`주문번호 ${item.orderNo}`}>
                        <span className={styles.srOnly}>주문번호 </span>
                        {shortOrderNo(item.orderNo)}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {hasNext && (
          <button
            type="button"
            className={styles.moreButton}
            disabled={isLoadingMore}
            onClick={loadMore}
          >
            {isLoadingMore ? '불러오는 중...' : '알림 더 보기'}
          </button>
        )}
      </>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>알림</h1>
        {items.length > 0 && (
          <button
            type="button"
            className={styles.readAllButton}
            disabled={!hasUnread || isReadingAll}
            onClick={handleReadAll}
          >
            모두 읽음
          </button>
        )}
      </div>
      {renderBody()}
    </div>
  );
}

export default NotificationPage;
