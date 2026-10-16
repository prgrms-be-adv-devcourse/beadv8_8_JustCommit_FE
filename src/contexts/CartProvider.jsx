import { useCallback, useEffect, useMemo, useState } from 'react';
import { addCartItem, getCart, removeCartItem } from '../api/cartApi';
import useAuth from '../hooks/useAuth';
import { CartContext } from './CartContext';

export function CartProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [cart, setCart] = useState(null);

  // 로그인 상태가 되면 장바구니를 불러옴
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    let ignore = false;
    getCart()
      .then((response) => {
        if (!ignore) setCart(response.data);
      })
      .catch(() => {
        if (!ignore) setCart(null);
      });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  const refreshCart = useCallback(async () => {
    const response = await getCart();
    setCart(response.data);
  }, []);

  const addToCart = useCallback(
    async (productId) => {
      await addCartItem(productId);
      // 담기는 이미 성공했으므로 개수 갱신 실패는 에러로 보이지 않게 무시
      await refreshCart().catch(() => {});
    },
    [refreshCart],
  );

  const removeFromCart = useCallback(
    async (productId) => {
      await removeCartItem(productId);
      await refreshCart().catch(() => {});
    },
    [refreshCart],
  );

  // 로그아웃 상태면 이전 장바구니를 보여 주지 않음
  const visibleCart = isLoggedIn ? cart : null;

  // 헤더 배지 숫자: 지금 구매할 수 있는 상품만 (판매완료·결제 대기·삭제·숨김 제외)
  const purchasableCount = visibleCart
    ? visibleCart.items.filter((item) => item.isPurchasable).length
    : 0;

  const value = useMemo(
    () => ({
      cart: visibleCart,
      purchasableCount,
      refreshCart,
      addToCart,
      removeFromCart,
    }),
    [visibleCart, purchasableCount, refreshCart, addToCart, removeFromCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
