import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getCartRecommendations, removeCartItem, updateCartItemPrices } from '../../api/cartApi';
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

// 장바구니 항목 → 화면 상태 (판정 근거: CartItemResponse의 status · hidden · isPurchasable, 상품 정보 없음)
// normal: 주문 가능 / priceChanged: 담을 때와 가격이 달라 확인 필요 / reserved: 다른 회원이 결제 중(거래 중)
// deleted: 판매자가 삭제했거나 상품 정보가 없음 / hidden: 판매자가 숨김 / soldOut: 판매 완료
// reviewing: 검수 중 · 반려 (다시 검수 중인 상품, 제목 · 사진을 가림) / unavailable: 그 밖의 구매 불가 (내 상품 등)
// 삭제된 상품은 항목이 그대로 오고 status가 DELETED (제목 등 상품 정보는 유지, BE CartService.toResponse)
// status · title이 비어 있는 경우는 BE에서 생기지 않지만 화면이 깨지지 않도록 같이 삭제로 봄
const REVIEW_STATUSES = ['REVIEW_PENDING', 'REJECTED'];

function getItemState(item, memberId, confirmedIds) {
  if (item.isPurchasable) {
    return item.isChangedPrice && !confirmedIds.has(item.cartItemId) ? { state: 'priceChanged' } : { state: 'normal' };
  }
  if (item.status === 'DELETED' || item.status == null || item.title == null) return { state: 'deleted' };
  if (item.hidden) return { state: 'hidden' };
  if (item.status === 'PAYMENT_PENDING') return { state: 'reserved' };
  if (item.status === 'SOLD_OUT') return { state: 'soldOut' };
  if (REVIEW_STATUSES.includes(item.status)) return { state: 'reviewing' };
  if (memberId != null && item.sellerId === memberId) {
    return { state: 'unavailable', badge: '내 상품', reason: '내가 판매하는 상품은 구매할 수 없어요.' };
  }
  return { state: 'unavailable', badge: '구매 불가', reason: '지금은 구매할 수 없는 상품이에요.' };
}

function toProductList(data) {
  const list = Array.isArray(data) ? data : (data?.content ?? []);
  return list.slice(0, RECOMMEND_SIZE);
}

// 새로 올라온 식물: 판매 중 상품 최신순, 내 상품 · 이미 담은 상품은 뺌 (BE ADR 0029)
// 빼고 나서도 4개를 채우도록 넉넉히 받음
const LATEST_FETCH_SIZE = 20;

async function fetchLatestProducts({ memberId, cartProductIds }) {
  const response = await getProducts({ onSale: true, page: 0, size: LATEST_FETCH_SIZE });
  const list = response.data.data?.content ?? [];
  return list
    .filter((product) => product.sellerId !== memberId && !cartProductIds.has(product.productId))
    .slice(0, RECOMMEND_SIZE);
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
  // 바뀐 가격을 확인한 항목 (서버에 저장한 뒤 다시 불러오기 전까지 화면에서 바로 반영)
  const [confirmedIds, setConfirmedIds] = useState(() => new Set());
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recommend, setRecommend] = useState(null);
  // 대체 목록에서 뺄 상품 (추천은 장바구니가 비었는지 바뀔 때만 다시 부르므로 최신 값을 ref로 봄)
  const excludeRef = useRef({ memberId: null, cartProductIds: new Set() });
  useEffect(() => {
    excludeRef.current = {
      memberId: user?.memberId ?? null,
      cartProductIds: new Set((cart?.items ?? []).map((item) => item.productId)),
    };
  }, [cart, user]);

  // 페이지에 들어올 때마다 최신 상태로 (그사이 다른 사람이 구매했을 수 있음)
  useEffect(() => {
    if (!isLoggedIn) return;
    refreshCart().catch(() => setLoadError(true));
  }, [isLoggedIn, refreshCart]);

  // AI 추천을 먼저 보여 주고, 추천이 없거나 실패하면 새로 올라온 식물
  // (장바구니가 비었는지 바뀔 때 다시 부름: 담기 · 비우기에 따라 추천 근거가 바뀜)
  const isCartEmpty = cart ? cart.items.length === 0 : null;
  useEffect(() => {
    if (isCartEmpty === null) return undefined;
    let ignore = false;

    async function load() {
      // 장바구니가 비어도 최근 구매 확정 상품으로 추천할 수 있어 항상 먼저 부름 (BE CartRecommendationService, ADR 0029)
      try {
        const response = await getCartRecommendations(RECOMMEND_SIZE);
        const products = toProductList(response.data.data ?? response.data);
        if (products.length > 0) return { isAi: true, products };
      } catch {
        // 추천 실패 → 새로 올라온 식물로
      }
      return { isAi: false, products: await fetchLatestProducts(excludeRef.current) };
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
    (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || b.cartItemId - a.cartItemId,
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

  // 바뀐 가격 확인 → 서버에 지금 가격으로 저장, 선택할 수 있게 되고 기본처럼 선택된 상태로
  // 그사이 가격이 또 바뀌었거나(PRICE_CHANGED) 살 수 없게 됐으면 장바구니를 다시 불러와 최신 상태로
  const confirmPrice = async (item) => {
    setErrorMessage('');
    try {
      await updateCartItemPrices([{ cartItemId: item.cartItemId, expectedPrice: item.price }]);
      refreshCart().catch(() => {});
      setConfirmedIds((prev) => new Set(prev).add(item.cartItemId));
      setUnselectedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.cartItemId);
        return next;
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
      refreshCart().catch(() => {});
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
