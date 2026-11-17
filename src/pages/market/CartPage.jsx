import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { confirmCartItemPrice, getCartRecommendations, removeCartItem } from '../../api/cartApi';
import { getProducts } from '../../api/productApi';
import { ACTION_ERROR } from '../../constants/actionError';
import { SHIPPING_FEE_PER_SELLER } from '../../constants/order';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import usePageTitle from '../../hooks/usePageTitle';
import CartView from './CartView';

// 탈퇴 등으로 판매자 회원이 없으면 sellerName이 null로 옴
const UNKNOWN_SELLER = '알 수 없는 판매자';
const RECOMMEND_SIZE = 4;

// 장바구니 항목 → 화면 상태
// normal: 주문 가능 / priceChanged: 담을 때와 가격이 달라 확인 필요 / reserved: 다른 회원이 결제 중(거래 중)
// soldOut: 판매 완료 / unavailable: 그 밖의 구매 불가 (삭제 · 숨김 · 내 상품)
function getItemState(item, memberId, confirmedIds) {
  if (item.isPurchasable) {
    return item.isChangedPrice && !confirmedIds.has(item.cartItemId) ? { state: 'priceChanged' } : { state: 'normal' };
  }
  if (item.status === 'PAYMENT_PENDING') return { state: 'reserved' };
  if (item.status === 'SOLD_OUT') return { state: 'soldOut' };
  if (item.status === 'DELETED') {
    return { state: 'unavailable', badge: '구매 불가', reason: '판매자가 삭제한 상품이에요.' };
  }
  if (item.hidden) return { state: 'unavailable', badge: '숨긴 상품', reason: '판매자가 상품을 숨겼어요.' };
  if (memberId != null && item.sellerId === memberId) {
    return { state: 'unavailable', badge: '내 상품', reason: '내가 판매하는 상품은 구매할 수 없어요.' };
  }
  return { state: 'unavailable', badge: '구매 불가', reason: '지금은 구매할 수 없는 상품이에요.' };
}

function toProductList(data) {
  const list = Array.isArray(data) ? data : (data?.content ?? []);
  return list.slice(0, RECOMMEND_SIZE);
}

// 새로 올라온 식물 (기본 정렬 = 최신순)
async function fetchLatestProducts() {
  const response = await getProducts({ page: 0, size: RECOMMEND_SIZE });
  return toProductList(response.data.data);
}

const MESSAGE_CLASS = 'flex-1 max-w-[1240px] w-full mx-auto px-5 py-8 text-[14px] text-[#6b7280]';

function CartPage() {
  usePageTitle('장바구니');
  const navigate = useNavigate();
  const { isLoggedIn, isInitializing, user } = useAuth();
  const { cart, refreshCart, removeFromCart } = useCart();

  const [loadError, setLoadError] = useState(false);
  // 기본은 전체 선택 → "선택 해제한 항목"만 기억
  const [unselectedIds, setUnselectedIds] = useState(() => new Set());
  const [removingIds, setRemovingIds] = useState(() => new Set());
  // 바뀐 가격을 확인한 항목 (TODO: 확인 API가 생기면 서버 값으로)
  const [confirmedIds, setConfirmedIds] = useState(() => new Set());
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recommend, setRecommend] = useState(null);

  // 페이지에 들어올 때마다 최신 상태로 (그사이 다른 사람이 구매했을 수 있음)
  useEffect(() => {
    if (!isLoggedIn) return;
    refreshCart().catch(() => setLoadError(true));
  }, [isLoggedIn, refreshCart]);

  // 장바구니가 비었으면 새로 올라온 식물, 아니면 AI 추천 (추천이 없거나 실패하면 새로 올라온 식물)
  const isCartEmpty = cart ? cart.items.length === 0 : null;
  useEffect(() => {
    if (isCartEmpty === null) return undefined;
    let ignore = false;

    async function load() {
      if (!isCartEmpty) {
        try {
          const response = await getCartRecommendations();
          const products = toProductList(response.data.data ?? response.data);
          if (products.length > 0) return { isAi: true, products };
        } catch {
          // 추천 실패 → 새로 올라온 식물로
        }
      }
      return { isAi: false, products: await fetchLatestProducts() };
    }

    load()
      .then((result) => {
        if (!ignore) setRecommend(result);
      })
      .catch(() => {
        if (!ignore) setRecommend(null);
      });

    return () => {
      ignore = true;
    };
  }, [isCartEmpty]);

  const closeRemoveConfirm = useCallback(() => setRemoveConfirmOpen(false), []);

  if (isInitializing) {
    return <main className={MESSAGE_CLASS}>불러오는 중...</main>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/cart' }} />;
  }
  if (!cart) {
    return (
      <main className={MESSAGE_CLASS}>
        {loadError ? '장바구니를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' : '불러오는 중...'}
      </main>
    );
  }

  // 최근에 담은 상품이 위로 (원본은 공유 상태라 복사본을 정렬)
  const sorted = [...cart.items].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt) || b.cartItemId - a.cartItemId,
  );
  const items = sorted.map((item) => ({
    ...getItemState(item, user?.memberId, confirmedIds),
    key: item.cartItemId,
    cartItemId: item.cartItemId,
    productId: item.productId,
    sellerId: item.sellerId,
    title: item.title,
    sellerName: item.sellerName ?? UNKNOWN_SELLER,
    thumbnailUrl: item.thumbnailUrl,
    price: Number(item.nowPrice),
    prevPrice: Number(item.price),
    checked: !unselectedIds.has(item.cartItemId),
    removing: removingIds.has(item.cartItemId),
  }));

  const selectableItems = items.filter((item) => item.state === 'normal');
  const selectedItems = selectableItems.filter((item) => item.checked);
  const allChecked = selectableItems.length > 0 && selectedItems.length === selectableItems.length;
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
  // 예상 배송비: 판매자별 기본 요금 (기본 배송지 기준, 제주 · 도서산간 추가 요금은 주문서에서 계산)
  // TODO: 배송비 계산 API가 생기면 기본 배송지 기준 금액으로 교체
  const sellerCount = new Set(selectedItems.map((item) => item.sellerId ?? `p${item.productId}`)).size;
  const shippingFee = sellerCount * SHIPPING_FEE_PER_SELLER;

  const toggleItem = (item) => {
    setErrorMessage('');
    setUnselectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.cartItemId)) next.delete(item.cartItemId);
      else next.add(item.cartItemId);
      return next;
    });
  };

  const toggleAll = () => {
    setErrorMessage('');
    setUnselectedIds(allChecked ? new Set(selectableItems.map((item) => item.cartItemId)) : new Set());
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
    setErrorMessage('');
    markRemoving(item.cartItemId, true);
    try {
      await removeFromCart(item.productId);
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
    } finally {
      markRemoving(item.cartItemId, false);
    }
  };

  // 선택 삭제: 삭제 API가 상품 하나씩이라 동시에 보내고, 끝난 뒤 한 번만 다시 불러옴
  const removeSelected = async () => {
    setRemoveConfirmOpen(false);
    setErrorMessage('');
    const results = await Promise.allSettled(selectedItems.map((item) => removeCartItem(item.productId)));
    await refreshCart().catch(() => {});
    if (results.some((result) => result.status === 'rejected')) {
      setErrorMessage(ACTION_ERROR.DEFAULT);
    }
  };

  // 바뀐 가격 확인 → 선택할 수 있게 되고, 기본처럼 선택된 상태로
  const confirmPrice = async (item) => {
    setErrorMessage('');
    try {
      await confirmCartItemPrice(item.productId);
      setConfirmedIds((prev) => new Set(prev).add(item.cartItemId));
      setUnselectedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.cartItemId);
        return next;
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
    }
  };

  const goToOrder = () => {
    const ids = selectedItems.map((item) => item.cartItemId).join(',');
    navigate(`/checkout?items=${ids}`);
  };

  return (
    <CartView
      items={items}
      selectedCount={selectedItems.length}
      selectableCount={selectableItems.length}
      allChecked={allChecked}
      subtotal={subtotal}
      sellerCount={sellerCount}
      shippingFee={shippingFee}
      total={subtotal + shippingFee}
      recommend={recommend}
      errorMessage={errorMessage}
      removeConfirmOpen={removeConfirmOpen}
      onToggle={toggleItem}
      onToggleAll={toggleAll}
      onRemove={removeOne}
      onAskRemoveSelected={() => setRemoveConfirmOpen(true)}
      onCloseRemoveSelected={closeRemoveConfirm}
      onRemoveSelected={removeSelected}
      onConfirmPrice={confirmPrice}
      onOrder={goToOrder}
    />
  );
}

export default CartPage;
