import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { updateCartItemPrices } from '../../api/cartApi';
import { addAddress, getAddresses } from '../../api/memberApi';
import { createCartOrder, getOrder, payOrder, quoteShippingFee, withSellerNicknames } from '../../api/orderApi';
import { ACTION_ERROR } from '../../constants/actionError';
import { SHIPPING_FEE_PER_SELLER } from '../../constants/order';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import { formatPrice, formatTime, maskPhone } from '../../utils/format';
import AddressModal from '../member/mypage/AddressModal';
import CheckoutView, { AddressChangeModal, LeaveModal, PriceChangedModal, ShippingFeeChangedModal } from './CheckoutView';
import { EMPTY } from '../../constants/emptyText';

// 주문서 두 가지 모드
// - /checkout?items=12,13 : 장바구니에서 고른 상품으로 새 주문 (배송지 변경 가능)
// - /checkout?orderId=7   : 결제 대기(PAYMENT_PENDING) 주문을 이어서 결제 (10분 카운트다운, 배송지 고정)
// 규칙 근거: BE docs/flows/order-payment.md, docs/services/market.md 「정책」

const PAYMENT_WINDOW_MS = 10 * 60 * 1000; // 결제 대기 10분 (주문 생성 시각부터)
const MAX_ADDRESSES = 4;
const UNKNOWN_SELLER = '알 수 없는 판매자';
// 주문 · 결제가 PAYMENT_FAILED로 끝났을 때 (결제가 안 됐고 상품 예약도 풀림)
const PAYMENT_FAILED_MESSAGE = '주문을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.';
const MESSAGE_CLASS = 'flex-1 max-w-[1240px] w-full mx-auto px-5 py-8 text-[14px] text-[#6b7280]';

// ?items=12,13 → [12, 13]
function parseItemIds(value) {
  return (value ?? '')
    .split(',')
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
}

function isDefaultAddress(address) {
  return address.isDefault ?? address.default ?? false;
}

function pickDefaultAddress(addresses) {
  return addresses.find(isDefaultAddress) ?? addresses[0] ?? null;
}

function toAddressText({ address1, address2, zipcode }) {
  return `${address1}${address2 ? `, ${address2}` : ''} (${zipcode})`;
}

function toAddressView(address) {
  return {
    addressId: address.addressId,
    recipientName: address.recipientName,
    phone: maskPhone(address.recipientPhone),
    addressText: toAddressText(address),
    isDefault: isDefaultAddress(address),
  };
}

// 장바구니 항목을 판매자별로 묶기
function groupCartItems(items, prevPrices) {
  const groups = new Map();
  items.forEach((item) => {
    const key = item.sellerId ?? `unknown-${item.productId}`;
    if (!groups.has(key)) {
      groups.set(key, { key, sellerId: item.sellerId, sellerName: item.sellerName ?? UNKNOWN_SELLER, items: [] });
    }
    groups.get(key).items.push({
      key: item.cartItemId,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      price: Number(item.nowPrice),
      prevPrice: prevPrices[item.cartItemId] ?? null,
    });
  });
  return [...groups.values()];
}

// 결제 대기 주문 상세 → 판매자별 묶음
// 판매자 이름은 주문 상세 응답에 없어 판매자 공개 API로 채움(withSellerNicknames). 실패하면 「-」
function groupOrderItems(order) {
  return (order.sellerOrders ?? []).map((sellerOrder) => ({
    key: sellerOrder.id,
    sellerId: sellerOrder.sellerId,
    sellerName: sellerOrder.sellerName ?? EMPTY,
    shippingFee: Number(sellerOrder.shippingFee ?? SHIPPING_FEE_PER_SELLER),
    items: sellerOrder.items.map((item) => ({
      key: item.id,
      title: item.productName,
      thumbnailUrl: item.thumbnailUrl,
      price: Number(item.price),
      prevPrice: null,
    })),
  }));
}

// 배송비 계산 결과(quote)를 판매자 묶음에 붙임. quote가 없으면 판매자별 기본 요금
function applyShippingFee(groups, quote) {
  return groups.map((group) => {
    const fee = quote?.sellers?.find((seller) => seller.sellerId === group.sellerId);
    if (!fee) return { ...group, shippingFee: group.shippingFee ?? SHIPPING_FEE_PER_SELLER };
    const detail =
      fee.extraFee > 0
        ? `(기본 ${formatPrice(fee.baseFee)} + ${quote.regionLabel} ${formatPrice(fee.extraFee)})`
        : null;
    return { ...group, shippingFee: Number(fee.fee), shippingDetail: detail };
  });
}

function getExpiresAt(order) {
  if (order.expiresAt) return new Date(order.expiresAt).getTime();
  return new Date(order.createdAt).getTime() + PAYMENT_WINDOW_MS;
}

function CheckoutPage() {
  usePageTitle('주문서');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const itemIdsParam = searchParams.get('items');
  const pendingOrderId = Number(searchParams.get('orderId')) || null;
  const autoPay = searchParams.get('pay') === '1'; // 충전을 마치고 돌아왔을 때 바로 결제
  const { isLoggedIn, isInitializing } = useAuth();
  const { refreshCart } = useCart();
  const { balance, refreshWallet } = useWallet();

  // 새 주문: 장바구니 항목 · 배송지
  const [cartItems, setCartItems] = useState(null); // null = 불러오는 중
  const [addresses, setAddresses] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [prevPrices, setPrevPrices] = useState({}); // 가격 변경을 받아들인 항목의 이전 가격
  const [quote, setQuote] = useState(null);
  // 결제 대기 주문
  const [pendingOrder, setPendingOrder] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const [loadError, setLoadError] = useState('');
  const [modal, setModal] = useState(null); // { type: 'address' | 'addAddress' | 'price' | 'shipping' | 'leave', ... }
  const [checkedAddressId, setCheckedAddressId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const autoPaidRef = useRef(false);

  // 새 주문: 들어올 때마다 장바구니 · 예치금을 최신 상태로
  useEffect(() => {
    if (!isLoggedIn || pendingOrderId) return undefined;
    let ignore = false;
    const itemIds = parseItemIds(itemIdsParam);

    refreshCart()
      .then((cart) => {
        if (!ignore) setCartItems(cart.items.filter((item) => itemIds.includes(item.cartItemId)));
      })
      .catch(() => {
        if (!ignore) setLoadError('주문할 상품을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      });
    getAddresses()
      .then((response) => {
        if (ignore) return;
        const list = response.data.data;
        setAddresses(list);
        setSelectedAddressId(pickDefaultAddress(list)?.addressId ?? null);
      })
      .catch(() => {
        if (!ignore) setAddresses([]);
      });
    refreshWallet().catch(() => {});

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, pendingOrderId, itemIdsParam, refreshCart, refreshWallet]);

  // 결제 대기 주문 불러오기 (이미 결제됐거나 만료됐으면 결과 화면으로)
  useEffect(() => {
    if (!isLoggedIn || !pendingOrderId) return undefined;
    let ignore = false;

    getOrder(pendingOrderId)
      .then((response) => withSellerNicknames(response.data.data ?? response.data))
      .then((order) => {
        if (ignore) return;
        if (order.status === 'PAYMENT_PENDING') {
          setPendingOrder(order);
        } else if (order.status === 'EXPIRED') {
          navigate(`/orders/${pendingOrderId}/expired`, { replace: true });
        } else {
          navigate(`/orders/${pendingOrderId}`, { replace: true });
        }
      })
      .catch(() => {
        if (!ignore) setLoadError('주문을 불러오지 못했어요. 주문 목록에서 다시 확인해 주세요.');
      });
    refreshWallet().catch(() => {});

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, pendingOrderId, navigate, refreshWallet]);

  // 결제 대기 남은 시간 (1초마다)
  const expiresAt = pendingOrder ? getExpiresAt(pendingOrder) : null;
  useEffect(() => {
    if (!expiresAt) return undefined;
    const timerId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timerId);
  }, [expiresAt]);
  const remainingSeconds = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0;

  useEffect(() => {
    if (expiresAt && remainingSeconds === 0) {
      navigate(`/orders/${pendingOrderId}/expired`, { replace: true });
    }
  }, [expiresAt, remainingSeconds, pendingOrderId, navigate]);

  // 배송지가 정해지면 배송비 계산 (TODO: 계산 API가 생기기 전까지는 판매자별 기본 요금)
  const selectedAddress = addresses?.find((address) => address.addressId === selectedAddressId) ?? null;
  const sellerIdsKey = cartItems ? [...new Set(cartItems.map((item) => item.sellerId))].join(',') : '';
  useEffect(() => {
    if (!selectedAddress || !sellerIdsKey) return undefined;
    let ignore = false;
    quoteShippingFee({ zipcode: selectedAddress.zipcode, sellerIds: sellerIdsKey.split(',').map(Number) })
      .then((result) => {
        if (!ignore) setQuote(result);
      })
      .catch(() => {
        if (!ignore) setQuote(null);
      });
    return () => {
      ignore = true;
    };
  }, [selectedAddress, sellerIdsKey]);

  // 결제 대기 주문에서 다른 화면으로 나가려 하면 확인 모달 (헤더 · 푸터 링크)
  useEffect(() => {
    if (!pendingOrder) return undefined;
    const handleClick = (event) => {
      const anchor = event.target.closest?.('a[href]');
      if (!anchor || anchor.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopPropagation();
      setModal({ type: 'leave', to: `${url.pathname}${url.search}` });
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pendingOrder]);

  const closeModal = useCallback(() => setModal(null), []);

  // ---------- 화면 데이터 ----------
  let groups = [];
  if (pendingOrder) groups = groupOrderItems(pendingOrder);
  else if (cartItems) groups = applyShippingFee(groupCartItems(cartItems, prevPrices), quote);

  const itemCount = groups.reduce((sum, group) => sum + group.items.length, 0);
  const subtotal = groups.reduce((sum, group) => sum + group.items.reduce((s, item) => s + item.price, 0), 0);
  const shippingTotal = groups.reduce((sum, group) => sum + group.shippingFee, 0);
  const total = pendingOrder ? Number(pendingOrder.totalAmount) : subtotal + shippingTotal;
  const shortage = balance != null ? Math.max(0, total - balance) : 0;
  const hasUnavailable = cartItems?.some((item) => !item.isPurchasable) ?? false;

  // 충전하러 가기: 시안 07-2-2 「주문서에서 넘어온 충전」. 주문 번호를 주소에 붙여야 그 화면이 나오고,
  // 충전이 끝나면 충전 완료 화면이 이 주문을 자동 결제(POST orders/{id}/pay)한 뒤 주문 완료로 보냄
  const goToCharge = (orderId, shortAmount) => {
    navigate(`/deposit/charge?orderId=${orderId}`, {
      state: { from: `/checkout?orderId=${orderId}&pay=1`, shortage: shortAmount },
    });
  };

  const goToComplete = (order) => {
    navigate(`/orders/${order.orderId}/complete`, { replace: true, state: { order } });
  };

  // 409: 장바구니를 다시 불러와 가격이 바뀐 상품 / 살 수 없게 된 상품을 찾음
  const reloadCartItems = async () => {
    const cart = await refreshCart();
    const ids = cartItems.map((item) => item.cartItemId);
    return cart.items.filter((item) => ids.includes(item.cartItemId));
  };

  const handleOrderError = async (error, retry) => {
    const code = error.response?.data?.code;
    if (code === 'SHIPPING_FEE_CHANGED') {
      const data = error.response?.data?.data ?? {};
      setModal({
        type: 'shipping',
        prevFee: shippingTotal,
        newFee: data.shippingFee ?? null,
        regionLabel: data.regionLabel ?? null,
        retry,
      });
      return;
    }
    if (code === 'OWN_PRODUCT') {
      setErrorMessage('내가 판매하는 상품은 구매할 수 없어요. 장바구니에서 빼고 다시 주문해 주세요.');
      refreshCart().catch(() => {});
      return;
    }
    if (error.response?.status === 409) {
      try {
        const latest = await reloadCartItems();
        const unavailable = latest.filter((item) => !item.isPurchasable);
        if (unavailable.length > 0) {
          navigate('/checkout/fail', {
            replace: true,
            state: {
              items: unavailable.map((item) => ({
                cartItemId: item.cartItemId,
                title: item.title,
                price: Number(item.nowPrice),
                thumbnailUrl: item.thumbnailUrl,
                status: item.status,
              })),
            },
          });
          return;
        }
        // BE는 장바구니에 저장된 가격(price)과 지금 가격(nowPrice)이 다르면 PRICE_CHANGED를 줌 (OrderService.create)
        // → 화면에 보여 준 가격과 달라진 상품뿐 아니라, 주문서에 들어올 때 이미 가격이 바뀐 상품(isChangedPrice)도 넣음
        const shown = Object.fromEntries(cartItems.map((item) => [item.cartItemId, Number(item.nowPrice)]));
        const changed = latest.filter(
          (item) => Number(item.nowPrice) !== shown[item.cartItemId] || item.isChangedPrice,
        );
        if (code === 'PRICE_CHANGED' || changed.length > 0) {
          setModal({
            type: 'price',
            items: changed.map((item) => ({
              key: item.cartItemId,
              title: item.title,
              prevPrice:
                Number(item.nowPrice) !== shown[item.cartItemId] ? shown[item.cartItemId] : Number(item.price),
              price: Number(item.nowPrice),
            })),
            latest,
          });
          return;
        }
      } catch {
        // 아래 공통 안내로
      }
    }
    setErrorMessage(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
  };

  // 새 주문 만들기 (잔액이 모자라면 결제 대기 주문이 만들어지고 충전 화면으로)
  const submitNewOrder = async (expectedShippingFee = shippingTotal) => {
    if (!selectedAddress || hasUnavailable || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await createCartOrder({
        cartItemIds: cartItems.map((item) => item.cartItemId),
        recipientName: selectedAddress.recipientName,
        recipientPhone: selectedAddress.recipientPhone,
        zipcode: selectedAddress.zipcode,
        address1: selectedAddress.address1,
        address2: selectedAddress.address2,
        expectedShippingFee,
      });
      const order = response.data.data ?? response.data;
      refreshCart().catch(() => {});
      refreshWallet().catch(() => {});
      // 주문 생성은 결제 결과와 상관없이 200으로 주문 상태를 줌 (BE OrderService.create · OrderPaymentTransactions.targetStatus)
      if (order.status === 'PAID') {
        goToComplete(order);
      } else if (order.status === 'PAYMENT_PENDING') {
        // 잔액 부족으로 결제 대기: 상품은 10분 동안 잡아 두고 충전하러 감
        goToCharge(order.orderId, Math.max(0, Number(order.totalAmount) - (balance ?? 0)));
      } else if (order.status === 'PAYMENT_PROCESSING') {
        // 결제 결과를 아직 모름 (타임아웃 등): 복구가 확정하므로 주문 상세에서 확인
        navigate(`/orders/${order.orderId}`, { replace: true });
      } else {
        // PAYMENT_FAILED: 상품 예약 결과 불명 · 결제 거절 · 지갑 없음 · 결제 서버 연결 실패
        setErrorMessage(PAYMENT_FAILED_MESSAGE);
      }
    } catch (error) {
      await handleOrderError(error, (fee) => submitNewOrder(fee));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 결제 대기 주문 결제
  const submitPendingPayment = useCallback(async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await payOrder(pendingOrderId);
      const order = response.data.data ?? response.data;
      // 재결제도 결과와 상관없이 200으로 주문 상태를 줌 (BE OrderService.repayment)
      if (order.status === 'PAID') {
        refreshWallet().catch(() => {});
        navigate(`/orders/${pendingOrderId}/complete`, {
          replace: true,
          state: { order: { ...pendingOrder, ...order, orderId: pendingOrderId } },
        });
      } else if (order.status === 'PAYMENT_PENDING') {
        // 잔액 부족: 결제 대기 유지 → 모자란 만큼 충전하러 감
        const wallet = await refreshWallet().catch(() => null);
        const nowBalance = wallet?.balance ?? balance ?? 0;
        const shortAmount = Math.max(0, Number(order.totalAmount ?? pendingOrder?.totalAmount) - nowBalance);
        navigate(`/deposit/charge?orderId=${pendingOrderId}`, {
          state: { from: `/checkout?orderId=${pendingOrderId}&pay=1`, shortage: shortAmount },
        });
      } else if (order.status === 'PAYMENT_PROCESSING') {
        refreshWallet().catch(() => {});
        navigate(`/orders/${pendingOrderId}`, { replace: true });
      } else {
        refreshWallet().catch(() => {});
        setErrorMessage(PAYMENT_FAILED_MESSAGE);
      }
    } catch (error) {
      if (error.response?.data?.code === 'PAYMENT_WINDOW_EXPIRED') {
        navigate(`/orders/${pendingOrderId}/expired`, { replace: true });
        return;
      }
      refreshWallet().catch(() => {});
      setErrorMessage(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
    } finally {
      setIsSubmitting(false);
    }
  }, [pendingOrderId, pendingOrder, balance, navigate, refreshWallet]);

  // 충전을 마치고 돌아왔고 잔액이 충분하면 한 번만 바로 결제
  useEffect(() => {
    if (!autoPay || !pendingOrder || autoPaidRef.current || balance == null) return undefined;
    if (balance < Number(pendingOrder.totalAmount)) return undefined;
    const timerId = setTimeout(() => {
      autoPaidRef.current = true;
      submitPendingPayment();
    }, 0);
    return () => clearTimeout(timerId);
  }, [autoPay, pendingOrder, balance, submitPendingPayment]);

  const handlePay = () => {
    if (pendingOrder) {
      if (shortage > 0) goToCharge(pendingOrderId, shortage);
      else submitPendingPayment();
      return;
    }
    submitNewOrder();
  };

  // 새 배송지 추가 팝업에서 호출: 실패하면 에러를 던져서 팝업이 메시지를 보여 줌
  const handleAddAddress = async (form) => {
    const response = await addAddress(form);
    const listResponse = await getAddresses();
    const list = listResponse.data.data;
    setAddresses(list);
    const newId = response.data.data?.addressId ?? pickDefaultAddress(list)?.addressId ?? null;
    if (selectedAddressId == null) {
      // 배송지가 하나도 없던 경우: 바로 이 배송지로
      setSelectedAddressId(newId);
      setModal(null);
    } else {
      // 배송지 변경 모달로 돌아가 새 배송지를 골라 둠
      setCheckedAddressId(newId);
      setModal({ type: 'address' });
    }
  };

  // 배송지를 바꾸면 배송비를 다시 계산 (quote 효과)
  const changeAddress = () => {
    setSelectedAddressId(checkedAddressId);
    setModal(null);
  };

  // 계산 결과에 추가 요금이 있으면 배송지를 바꿨을 때 안내
  const extraRegion = quote?.sellers?.some((seller) => seller.extraFee > 0) ? quote.regionLabel : null;
  const addressNotice =
    extraRegion && selectedAddress && !isDefaultAddress(selectedAddress)
      ? `배송지를 바꿔서 배송비를 다시 계산했어요. ${extraRegion} 추가 요금이 붙었어요.`
      : '';

  // ---------- 화면 ----------
  if (isInitializing) {
    return <main className={MESSAGE_CLASS}>불러오는 중...</main>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (loadError) {
    return <main className={MESSAGE_CLASS}>{loadError}</main>;
  }
  if (pendingOrderId ? !pendingOrder : !cartItems || !addresses) {
    return <main className={MESSAGE_CLASS}>불러오는 중...</main>;
  }
  if (!pendingOrder && cartItems.length === 0) {
    return (
      <main className={MESSAGE_CLASS}>
        주문할 상품이 없어요. 장바구니에서 상품을 다시 선택해 주세요.{' '}
        <Link to="/cart" className="font-semibold text-[#0f4c3a]">
          장바구니로 가기
        </Link>
      </main>
    );
  }

  const addressView = pendingOrder
    ? {
        recipientName: pendingOrder.recipientName,
        phone: maskPhone(pendingOrder.recipientPhone),
        addressText: toAddressText(pendingOrder),
        isDefault: false,
      }
    : selectedAddress && toAddressView(selectedAddress);

  let modalNode = null;
  if (modal?.type === 'address') {
    modalNode = (
      <AddressChangeModal
        addresses={addresses.map(toAddressView)}
        checkedId={checkedAddressId}
        maxCount={MAX_ADDRESSES}
        onCheck={setCheckedAddressId}
        onAddNew={() => setModal({ type: 'addAddress' })}
        onClose={closeModal}
        onSubmit={changeAddress}
      />
    );
  } else if (modal?.type === 'addAddress') {
    modalNode = <AddressModal onSubmit={handleAddAddress} onClose={closeModal} />;
  } else if (modal?.type === 'price') {
    modalNode = (
      <PriceChangedModal
        items={modal.items}
        onClose={closeModal}
        onSubmit={async () => {
          // 바뀐 가격을 받아들이면 장바구니에 지금 가격을 저장하고(BE는 저장된 가격으로 PRICE_CHANGED를 판단),
          // 주문서에 이전 가격을 줄 그어 보여 준 뒤 다시 결제 버튼을 누르게 함
          const { items: changedItems, latest } = modal;
          setModal(null);
          setErrorMessage('');
          const toUpdate = latest
            .filter((item) => item.isChangedPrice)
            .map((item) => ({ cartItemId: item.cartItemId, expectedPrice: item.nowPrice }));
          let nextItems = latest;
          if (toUpdate.length > 0) {
            // 저장이 끝나기 전에 결제를 누르면 옛 가격으로 주문돼 다시 PRICE_CHANGED가 나므로 그동안 결제 버튼을 막음
            setIsSubmitting(true);
            try {
              const response = await updateCartItemPrices(toUpdate);
              const cart = response.data.data ?? response.data;
              const ids = latest.map((item) => item.cartItemId);
              nextItems = (cart?.items ?? []).filter((item) => ids.includes(item.cartItemId));
              refreshCart().catch(() => {});
            } catch (error) {
              // 그사이 가격이 또 바뀌었거나(PRICE_CHANGED) 살 수 없게 됨(PRODUCT_UNAVAILABLE)
              setErrorMessage(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
              refreshCart().catch(() => {});
              return;
            } finally {
              setIsSubmitting(false);
            }
          }
          setPrevPrices((prev) => ({
            ...prev,
            ...Object.fromEntries(changedItems.map((item) => [item.key, item.prevPrice])),
          }));
          setCartItems(nextItems);
        }}
      />
    );
  } else if (modal?.type === 'shipping') {
    modalNode = (
      <ShippingFeeChangedModal
        sellerCount={groups.length}
        prevFee={modal.prevFee}
        newFee={modal.newFee}
        regionLabel={modal.regionLabel}
        onClose={closeModal}
        onSubmit={() => {
          setModal(null);
          modal.retry(modal.newFee);
        }}
      />
    );
  } else if (modal?.type === 'leave') {
    modalNode = (
      <LeaveModal
        remainingText={formatTime(remainingSeconds)}
        total={total}
        shortage={shortage}
        onStay={closeModal}
        onLeave={() => {
          const { to } = modal;
          setModal(null);
          navigate(to); // 코드로 이동하므로 링크 가로채기에 걸리지 않음
        }}
      />
    );
  }

  return (
    <CheckoutView
      pending={pendingOrder ? { remainingText: formatTime(remainingSeconds) } : null}
      address={addressView}
      canChangeAddress={!pendingOrder}
      addressNotice={addressNotice}
      groups={groups}
      itemCount={itemCount}
      subtotal={subtotal}
      shippingTotal={shippingTotal}
      total={total}
      balance={balance}
      isSubmitting={isSubmitting}
      payDisabled={!pendingOrder && (!selectedAddress || hasUnavailable)}
      errorMessage={
        errorMessage ||
        (hasUnavailable ? '구매할 수 없는 상품이 있어요. 장바구니에서 빼고 다시 주문해 주세요.' : '')
      }
      onChangeAddress={() => {
        setCheckedAddressId(selectedAddressId);
        setModal({ type: 'address' });
      }}
      onAddAddress={() => setModal({ type: 'addAddress' })}
      onPay={handlePay}
      modal={modalNode}
    />
  );
}

export default CheckoutPage;
