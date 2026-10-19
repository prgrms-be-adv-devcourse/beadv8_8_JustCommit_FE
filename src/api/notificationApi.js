import client from './client';

// 알림 API는 ApiResponse로 감싸지 않고 DTO를 그대로 반환

// 알림 목록 (최신순) params = { page, size, isRead? }
// → { content: [{ notificationId, type, message, orderId, sellerOrderId, isRead, createdAt, readAt }], page, size, totalElements, totalPages }
// orderId: 구매자 알림에만 있음 (판매자 알림·이전에 만든 알림은 null)
export function getNotifications(params) {
  return client.get('/api/v1/notifications', { params });
}

// 안 읽은 알림 수 → { count }
export function getUnreadNotificationCount() {
  return client.get('/api/v1/notifications/unread-count');
}

// 알림 하나 읽음 → NotificationResponse
export function readNotification(notificationId) {
  return client.patch(`/api/v1/notifications/${notificationId}`, { isRead: true });
}

// 내 알림 모두 읽음 → 204
export function readAllNotifications() {
  return client.patch('/api/v1/notifications', { isRead: true });
}
