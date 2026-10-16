import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { removeCartItem } from '../../api/cartApi';
import ConfirmModal from '../../components/common/ConfirmModal';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import usePageTitle from '../../hooks/usePageTitle';
import { formatPrice } from '../../utils/format';
import styles from './CartPage.module.css';

// TODO: CartItemResponse에 thumbnailUrl·sellerName·status·sellerId가 추가되면
//       사진, 판매자 이름, 판매완료 구분, 판매자별 배송비(판매자당 3,000원) 연결

function CartPage() {
  usePageTitle('장바구니');
  const navigate = useNavigate();
  const { isLoggedIn, isInitializing } = useAuth();
  const { cart, refreshCart, removeFromCart } = useCart();

  const [loadError, setLoadError] = useState(false);
  // 기본은 전체 선택 → "선택 해제한 항목"만 기억 (불러온 뒤 초기값을 넣을 필요가 없음)
  const [unselectedIds, setUnselectedIds] = useState(() => new Set());
  const [removingIds, setRemovingIds] = useState(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 페이지에 들어올 때마다 최신 상태로 (그사이 다른 사람이 구매했을 수 있음)
  useEffect(() => {
    if (!isLoggedIn) return;
    refreshCart().catch(() => setLoadError(true));
  }, [isLoggedIn, refreshCart]);

  // ConfirmModal의 useEffect가 onClose에 의존하므로 함수 고정
  const closeConfirm = useCallback(() => setConfirmOpen(false), []);

  if (isInitializing) {
    return <p className={styles.message}>불러오는 중...</p>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/cart' }} />;
  }
  if (!cart) {
    return (
      <p className={styles.message}>
        {loadError ? '장바구니를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' : '불러오는 중...'}
      </p>
    );
  }

  const items = cart.items;
  const purchasableItems = items.filter((item) => item.isPurchasable);
  const selectedItems = purchasableItems.filter((item) => !unselectedIds.has(item.cartItemId));
  const allChecked = purchasableItems.length > 0 && selectedItems.length === purchasableItems.length;
  const subtotal = selectedItems.reduce((sum, item) => sum + Number(item.nowPrice), 0);

  const toggleItem = (cartItemId) => {
    setUnselectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cartItemId)) next.delete(cartItemId);
      else next.add(cartItemId);
      return next;
    });
  };

  const toggleAll = () => {
    setUnselectedIds(
      allChecked ? new Set(purchasableItems.map((item) => item.cartItemId)) : new Set(),
    );
  };

  const markRemoving = (cartItemId, removing) => {
    setRemovingIds((prev) => {
      const next = new Set(prev);
      if (removing) next.add(cartItemId);
      else next.delete(cartItemId);
      return next;
    });
  };

  const removeOne = async (item) => {
    markRemoving(item.cartItemId, true);
    try {
      await removeFromCart(item.productId);
    } catch (error) {
      alert(error.response?.data?.message ?? '삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      markRemoving(item.cartItemId, false);
    }
  };

  // 선택 삭제: 삭제 API가 상품 하나씩이라 동시에 보내고, 끝난 뒤 한 번만 다시 불러옴
  const removeSelected = async () => {
    setConfirmOpen(false);
    const results = await Promise.allSettled(
      selectedItems.map((item) => removeCartItem(item.productId)),
    );
    await refreshCart().catch(() => {});
    const failedCount = results.filter((result) => result.status === 'rejected').length;
    if (failedCount > 0) {
      alert(`${failedCount}개 상품을 삭제하지 못했어요. 다시 시도해 주세요.`);
    }
  };

  const goToOrder = () => {
    const ids = selectedItems.map((item) => item.cartItemId).join(',');
    navigate(`/orders/new?cartItemIds=${ids}`);
  };

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <h1 className={styles.heading}>
          장바구니 <span className={styles.headingCount}>0개</span>
        </h1>
        <div className={styles.empty}>
          <span className={`material-symbols-outlined ${styles.emptyIcon}`} aria-hidden="true">
            shopping_cart
          </span>
          <h2 className={styles.emptyTitle}>장바구니가 비어 있어요</h2>
          <p className={styles.emptyText}>마음에 드는 식물을 담아 보세요.</p>
          <Link to="/" className={styles.primaryLink}>
            식물 둘러보기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>
        장바구니 <span className={styles.headingCount}>{items.length}개</span>
      </h1>

      <div className={styles.layout}>
        <section aria-label="담은 상품" className={styles.listCard}>
          <div className={styles.listHeader}>
            <label className={styles.selectAll}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={allChecked}
                disabled={purchasableItems.length === 0}
                onChange={toggleAll}
              />
              전체 선택
              <span className={styles.selectCount}>
                {selectedItems.length}/{purchasableItems.length}
              </span>
            </label>
            <button
              type="button"
              className={styles.ghostButton}
              disabled={selectedItems.length === 0}
              onClick={() => setConfirmOpen(true)}
            >
              선택 삭제
            </button>
          </div>

          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.cartItemId} className={styles.item}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  aria-label={`${item.title} 선택`}
                  checked={item.isPurchasable && !unselectedIds.has(item.cartItemId)}
                  disabled={!item.isPurchasable}
                  onChange={() => toggleItem(item.cartItemId)}
                />
                <Link
                  to={`/products/${item.productId}`}
                  className={`${styles.itemLink} ${item.isPurchasable ? '' : styles.unavailable}`}
                >
                  <span className={styles.thumb} aria-hidden="true">
                    <span className={`material-symbols-outlined ${styles.thumbIcon}`}>
                      potted_plant
                    </span>
                  </span>
                  <span className={styles.info}>
                    {!item.isPurchasable && <span className={styles.badge}>구매 불가</span>}
                    <span className={styles.title}>{item.title}</span>
                    {item.isChangedPrice && (
                      <span className={styles.priceChanged}>
                        담을 때 {formatPrice(Number(item.price))}에서 가격이 바뀌었어요
                      </span>
                    )}
                  </span>
                  <strong className={styles.price}>{formatPrice(Number(item.nowPrice))}</strong>
                </Link>
                <button
                  type="button"
                  className={styles.removeButton}
                  aria-label={`${item.title} 삭제`}
                  disabled={removingIds.has(item.cartItemId)}
                  onClick={() => removeOne(item)}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    close
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside aria-labelledby="cart-summary-title" className={styles.summary}>
          <h2 id="cart-summary-title" className={styles.summaryTitle}>
            선택 상품 금액
          </h2>
          <dl className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <dt>상품 금액 ({selectedItems.length}개)</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>배송비</dt>
              <dd>주문 시 계산</dd>
            </div>
          </dl>
          <div className={styles.divider} />
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>상품 합계</span>
            <strong className={styles.totalPrice}>{formatPrice(subtotal)}</strong>
          </div>
          <button
            type="button"
            className={styles.orderButton}
            disabled={selectedItems.length === 0}
            onClick={goToOrder}
          >
            선택 상품 주문하기{selectedItems.length > 0 ? ` (${selectedItems.length})` : ''}
          </button>
          {selectedItems.length === 0 && <p className={styles.hint}>주문할 상품을 선택해 주세요.</p>}
          <p className={styles.hint}>
            배송비는 판매자별로 3,000원씩 주문 단계에서 더해져요. 구매할 수 없는 상품은 선택할 수
            없어요.
          </p>
        </aside>
      </div>

      {confirmOpen && (
        <ConfirmModal
          icon="delete"
          title="선택한 상품을 삭제할까요?"
          message={`${selectedItems.length}개 상품이 장바구니에서 빠져요.`}
          confirmText="삭제"
          cancelText="취소"
          onConfirm={removeSelected}
          onClose={closeConfirm}
        />
      )}
    </div>
  );
}

export default CartPage;
