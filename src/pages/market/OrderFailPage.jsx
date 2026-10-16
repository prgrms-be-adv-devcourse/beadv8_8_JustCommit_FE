import { Link, useLocation } from 'react-router-dom';
import ProductThumbnail from '../../components/product/ProductThumbnail';
import usePageTitle from '../../hooks/usePageTitle';
import { formatPrice } from '../../utils/format';
import styles from './OrderResult.module.css';

// 상태 배지: 메인 상품 카드와 같은 이름·색 (결제 대기 / 판매완료), 그 밖의 구매 불가는 "구매 불가"
function getStatusBadge(item) {
  if (item.isPurchasable) return null;
  if (item.status === 'PAYMENT_PENDING') {
    return { label: '결제 대기', tone: 'pending', hint: '다시 판매될 수 있어요' };
  }
  if (item.status === 'SOLD_OUT') {
    return { label: '판매완료', tone: 'soldOut', dim: true };
  }
  return { label: '구매 불가', tone: 'soldOut', dim: true };
}

// 시안 5-B 주문 실패 (409 PRODUCT_UNAVAILABLE · PRICE_CHANGED)
// 에러 응답에는 상품 정보가 없어서, 주문서가 장바구니를 다시 조회해 문제 상품을 state로 넘겨 줌
// items: [{ cartItemId, title, price(지금 가격), cartPrice(담을 때 가격), thumbnailUrl, status, isPurchasable, isChangedPrice }]
function OrderFailPage() {
  usePageTitle('주문 실패');
  const location = useLocation();
  const items = location.state?.items ?? []; // 새로고침·주소로 들어오면 목록 없이 안내만

  const hasUnavailable = items.some((item) => !item.isPurchasable);
  const description =
    items.length > 0 && !hasUnavailable
      ? '주문하는 사이 가격이 바뀐 상품이 있어요'
      : '다른 분이 먼저 결제했거나 결제를 진행 중인 상품이 있어요';

  return (
    <div className={styles.page}>
      <section aria-labelledby="fail-title" className={styles.card}>
        <span className={`material-symbols-outlined ${styles.icon} ${styles.iconError}`} aria-hidden="true">
          warning
        </span>
        <div className={styles.titleGroup}>
          <h1 id="fail-title" className={styles.title}>
            주문하지 못했어요
          </h1>
          <p className={styles.description}>{description}</p>
        </div>

        {items.length > 0 && (
          <ul aria-label="주문하지 못한 상품" className={styles.failList}>
            {items.map((item) => {
              const badge = getStatusBadge(item);
              return (
                <li key={item.cartItemId} className={styles.failItem}>
                  <span className={`${styles.thumb} ${badge?.dim ? styles.thumbDim : ''}`}>
                    <ProductThumbnail src={item.thumbnailUrl} alt="" size="small" />
                  </span>
                  <span className={styles.failInfo}>
                    <span className={styles.failTitle}>{item.title}</span>
                    <span className={styles.failMeta}>
                      <strong className={styles.failPrice}>{formatPrice(item.price)}</strong>
                      {badge && <span className={`${styles.badge} ${styles[badge.tone]}`}>{badge.label}</span>}
                      {item.isChangedPrice && (
                        <span className={`${styles.badge} ${styles.priceChanged}`}>가격 변경</span>
                      )}
                      {badge?.hint && <span className={styles.failHint}>{badge.hint}</span>}
                      {item.isChangedPrice && (
                        <span className={styles.failHint}>담을 때 {formatPrice(item.cartPrice)}</span>
                      )}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <p className={styles.notice}>
          <span className={`material-symbols-outlined ${styles.noticeIcon}`} aria-hidden="true">
            account_balance_wallet
          </span>
          예치금은 빠져나가지 않았어요. 나머지 상품은 장바구니에 그대로 있어요
        </p>

        <div className={styles.actions}>
          <Link to="/" className={styles.secondaryButton}>
            다른 식물 보러 가기
          </Link>
          <Link to="/cart" className={styles.primaryButton}>
            장바구니로 돌아가기
          </Link>
        </div>
      </section>
    </div>
  );
}

export default OrderFailPage;
