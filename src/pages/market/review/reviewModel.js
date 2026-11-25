import { formatRating, getTagLabel } from '../../../constants/review';
import { EMPTY } from '../../../constants/emptyText';
import { formatDate, formatMonthDay, toValidDate } from '../../../utils/format';

// 05 리뷰 화면(주문 상세 리뷰 영역 · 작성 · 완료 · 리뷰 관리) 데이터 모양 맞추기
// 응답 모양은 api/reviewApi.js 주석 참고

// 판매자 주문 하나의 리뷰 상태 (BE SellerOrderReviewStatus)
// rowText = 주문 상세 줄 오른쪽 안내, badge = 작성 화면 판매자 목록의 회색 표시,
// reason = 작성 화면에서 주소로 받은 판매자를 쓸 수 없을 때 이유
export const REVIEW_STATUS = {
  WRITABLE: { rowText: null, badge: null, reason: null },
  WRITTEN: { rowText: null, badge: '작성 완료', reason: '이 판매자에게는 이미 리뷰를 썼어요.' },
  DELETED: {
    rowText: '삭제한 리뷰는 다시 쓸 수 없어요',
    badge: '삭제함',
    reason: '이 판매자에게 쓴 리뷰를 삭제해서 다시 쓸 수 없어요.',
  },
  NOT_CONFIRMED: {
    rowText: '구매 확정 전 상품이 있어요',
    badge: '구매 확정 전',
    reason: '이 판매자의 상품을 모두 구매 확정하면 리뷰를 쓸 수 있어요.',
  },
  NO_CONFIRMED_ITEM: {
    rowText: '구매 확정된 상품이 없어 리뷰를 쓸 수 없어요',
    badge: '확정 상품 없음',
    reason: '이 판매자에게서 구매 확정된 상품이 없어 리뷰를 쓸 수 없어요.',
  },
  EXPIRED: {
    rowText: '작성 기간이 지났어요',
    badge: '기간 지남',
    reason: '리뷰 작성 기간(구매 확정 후 3일)이 지났어요.',
  },
};

export function tagLabels(tags) {
  return (tags ?? []).map(getTagLabel);
}

// "몬스테라" · "몬스테라 외 1건"
function namesText(names, unit = '건') {
  if (!names?.length) return EMPTY;
  return names.length > 1 ? `${names[0]} 외 ${names.length - 1}${unit}` : names[0];
}

// GET reviews/orders/{orderId}의 sellerOrders[] 하나 → 화면 줄
// fallbackNames: 구매 확정 전이면 productNames가 비어 올 수 있어 주문 상세의 상품 이름으로 채움
export function toSellerOrderRow(sellerOrder, fallbackNames = []) {
  const names = sellerOrder.productNames?.length ? sellerOrder.productNames : fallbackNames;
  return {
    key: sellerOrder.sellerOrderId,
    sellerOrderId: sellerOrder.sellerOrderId,
    sellerName: sellerOrder.sellerNickname ?? EMPTY,
    productNames: names,
    itemsText: namesText(names),
    status: sellerOrder.reviewStatus,
    writable: sellerOrder.reviewStatus === 'WRITABLE',
    confirmedText: formatDate(sellerOrder.confirmedAt),
    deadlineText: formatMonthDay(sellerOrder.writableUntil),
  };
}

// 주문 상세 리뷰 영역 (시안 05-1-1 확정 전 · 05-1-2 모두 확정 · 05-1-3 일부 작성)
// status = GET reviews/orders/{orderId} 응답, order = 주문 상세 응답 (상품 이름 대신 쓰기)
// → { notice: { text, tone }, rows, myReviews } (판매자 주문이 없으면 null)
export function buildOrderReviewSection(status, order) {
  if (!status?.sellerOrders?.length) return null;
  const orderSellerOrders = order?.sellerOrders ?? [];
  const rows = status.sellerOrders.map((sellerOrder) => {
    const orderSellerOrder = orderSellerOrders.find(
      (item) => item.id === sellerOrder.sellerOrderId,
    );
    const fallbackNames = (orderSellerOrder?.items ?? []).map((item) => item.productName);
    return {
      ...toSellerOrderRow(sellerOrder, fallbackNames),
      writeTo: `/orders/${status.orderId}/review?sellerOrderId=${sellerOrder.sellerOrderId}`,
    };
  });

  const myReviews = status.sellerOrders
    .filter((sellerOrder) => sellerOrder.reviewStatus === 'WRITTEN' && sellerOrder.review)
    .map((sellerOrder) => {
      const { review } = sellerOrder;
      const rating = Number(review.rating);
      return {
        key: review.reviewId,
        rating,
        ratingText: formatRating(rating),
        meta: `${formatDate(review.createdAt)} · ${sellerOrder.sellerNickname ?? EMPTY}`,
        tags: tagLabels(review.tags),
        content: review.content,
        itemsText: namesText(sellerOrder.productNames),
      };
    });

  const { targetCount, writtenCount, writableCount } = status.summary;
  let notice;
  if (writtenCount > 0) {
    notice = { tone: 'success', text: `리뷰 ${targetCount}개 중 ${writtenCount}개를 작성했어요` };
  } else if (writableCount > 0) {
    notice = { tone: 'success', text: '구매 확정이 끝났어요. 식물은 잘 받으셨나요?' };
  } else if (rows.some((row) => row.status === 'NOT_CONFIRMED')) {
    notice = {
      tone: 'muted',
      text: '판매자의 상품을 모두 구매 확정하면 그 판매자의 리뷰를 쓸 수 있어요',
    };
  } else if (targetCount > 0) {
    notice = { tone: 'muted', text: '리뷰 작성 기간(구매 확정 후 3일)이 지났어요' };
  } else {
    notice = { tone: 'muted', text: '구매 확정된 상품이 없어 쓸 수 있는 리뷰가 없어요' };
  }
  return { notice, rows, myReviews };
}

// GET reviews/me의 content[] 하나 → 내가 쓴 리뷰 (시안 05-3-1). now = 지금 시각(ms)
export function toMyReviewItem(review, writerNickname, now) {
  const rating = Number(review.rating);
  const deletableUntil = toValidDate(review.deletableUntil);
  return {
    key: review.reviewId,
    reviewId: review.reviewId,
    sellerName: review.sellerNickname ?? EMPTY,
    orderedText: `${formatDate(review.orderedAt)} 주문`,
    deletable: deletableUntil != null && now < deletableUntil.getTime(),
    deleteDeadlineText: `${formatMonthDay(deletableUntil)}까지 삭제할 수 있어요`,
    card: {
      nickname: writerNickname ?? EMPTY,
      rating,
      ratingText: formatRating(rating),
      dateText: formatDate(review.createdAt),
      tags: tagLabels(review.tags),
      content: review.content,
      productText: review.productNames?.length
        ? `구매 상품 · ${review.productNames.join(', ')}`
        : '',
    },
  };
}

// GET reviews/writable의 항목 하나 → 쓸 수 있는 리뷰 (시안 05-3-3)
export function toWritableItem(item) {
  return {
    key: item.sellerOrderId,
    sellerName: item.sellerNickname ?? EMPTY,
    metaText: `${formatDate(item.orderedAt)} 주문 · 구매 확정 ${formatDate(item.confirmedAt)}`,
    deadlineText: `${formatMonthDay(item.writableUntil)}까지 작성 가능`,
    productNames: item.productNames ?? [],
    writeTo: `/orders/${item.orderId}/review?sellerOrderId=${item.sellerOrderId}`,
  };
}

// GET reviews/summary → 받은 리뷰 요약 (시안 05-3-4)
// 별점 막대는 리뷰가 있는 구간만 (시안도 0개 구간은 그리지 않음), 비율 = 구간 개수 / 전체
export function buildReceivedSummary(summary) {
  const total = summary.reviewCount;
  const average = summary.averageRating == null ? null : Number(summary.averageRating);
  return {
    averageText: average == null ? EMPTY : average.toFixed(1),
    average: average ?? 0,
    countText: `리뷰 ${total.toLocaleString('ko-KR')}개`,
    bars: (summary.ratingCounts ?? [])
      .filter((item) => item.count > 0)
      .map((item) => ({
        key: String(item.rating),
        label: `${Number(item.rating).toFixed(1)}점`,
        count: item.count,
        percent: total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0,
      })),
  };
}
