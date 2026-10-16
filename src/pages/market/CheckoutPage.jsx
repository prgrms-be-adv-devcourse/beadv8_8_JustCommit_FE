import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { addAddress, getAddresses } from '../../api/memberApi';
import { createCartOrder } from '../../api/orderApi';
import { getProduct } from '../../api/productApi';
import ProductThumbnail from '../../components/product/ProductThumbnail';
import { SHIPPING_FEE_PER_SELLER } from '../../constants/order';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import { formatPhone, formatPrice } from '../../utils/format';
import AddressModal from '../member/mypage/AddressModal';
import styles from './CheckoutPage.module.css';

// ?items=12,13 → [12, 13]
function parseItemIds(value) {
  return (value ?? '')
    .split(',')
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
}

// 01012345678 → 010-****-5678
function maskPhone(phone) {
  return formatPhone(phone).replace(/^(\d{3})-\d{3,4}-(\d{4})$/, '$1-****-$2');
}

// 응답 필드 이름이 isDefault / default 중 어느 쪽이어도 동작하도록
function isDefaultAddress(address) {
  return address.isDefault ?? address.default ?? false;
}

function pickDefaultAddress(addresses) {
  return addresses.find(isDefaultAddress) ?? addresses[0] ?? null;
}

// 상품 상세(판매자·품종·사진)를 붙여 판매자별로 묶기 — 장바구니 응답에는 판매자 정보가 없음
// TODO: CartItemResponse에 sellerId·sellerName·thumbnailUrl이 추가되면 상품 상세 조회 제거
function groupBySeller(items, details) {
  const groups = new Map();
  items.forEach((item) => {
    const detail = details[item.productId];
    const key = detail?.sellerId ?? `unknown-${item.productId}`;
    if (!groups.has(key)) {
      groups.set(key, { key, sellerName: detail?.sellerName ?? '판매자 정보 없음', items: [] });
    }
    groups.get(key).items.push({ ...item, detail });
  });
  return [...groups.values()];
}

// 배송지 고르기 팝업
function AddressSelectModal({ addresses, selectedId, onSelect, onAddNew, onClose }) {
  const [checkedId, setCheckedId] = useState(selectedId);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="address-select-title">
        <div className={styles.modalHeader}>
          <h2 id="address-select-title" className={styles.cardTitle}>
            배송지 선택
          </h2>
          <button type="button" className={styles.outlineButton} onClick={onAddNew}>
            새 배송지 추가
          </button>
        </div>
        <ul className={styles.addressOptions}>
          {addresses.map((address) => (
            <li key={address.addressId}>
              <label
                className={`${styles.addressOption} ${checkedId === address.addressId ? styles.addressOptionChecked : ''}`}
              >
                <input
                  type="radio"
                  name="address"
                  className={styles.radio}
                  checked={checkedId === address.addressId}
                  onChange={() => setCheckedId(address.addressId)}
                />
                <span className={styles.addressBody}>
                  <span className={styles.recipientRow}>
                    <strong className={styles.recipientName}>{address.recipientName}</strong>
                    {address.addressName && <span className={styles.addressName}>{address.addressName}</span>}
                    {isDefaultAddress(address) && <span className={styles.defaultBadge}>기본 배송지</span>}
                  </span>
                  <span className={styles.phone}>{maskPhone(address.recipientPhone)}</span>
                  <span className={styles.addressText}>
                    {address.address1}
                    {address.address2 ? `, ${address.address2}` : ''} ({address.zipcode})
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className={styles.modalActions}>
          <button type="button" className={styles.modalCancel} onClick={onClose}>
            취소
          </button>
          <button type="button" className={styles.modalConfirm} onClick={() => onSelect(checkedId)}>
            이 주소로 배송
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckoutPage() {
  usePageTitle('주문서');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const itemIdsParam = searchParams.get('items');
  const { isLoggedIn, isInitializing } = useAuth();
  const { refreshCart } = useCart();
  const { balance, refreshWallet } = useWallet();

  // 주문할 장바구니 항목 + 상품 상세(판매자·품종·사진)
  const [orderItems, setOrderItems] = useState(null); // null = 불러오는 중
  const [details, setDetails] = useState({}); // { [productId]: 상품 상세 }
  const [loadError, setLoadError] = useState('');

  const [addresses, setAddresses] = useState(null); // null = 불러오는 중
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressModal, setAddressModal] = useState(null); // 'select' | 'add' | null

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // 들어올 때마다 장바구니·예치금을 최신 상태로 (그사이 다른 사람이 샀거나 충전했을 수 있음)
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    const itemIds = parseItemIds(itemIdsParam);

    async function loadItems() {
      try {
        const cart = await refreshCart();
        const items = cart.items.filter((item) => itemIds.includes(item.cartItemId));
        // 상세 조회는 하나가 실패해도 나머지는 보여 줌 (판매자 정보 없음으로 표시)
        const results = await Promise.allSettled(items.map((item) => getProduct(item.productId)));
        if (ignore) return;

        const nextDetails = {};
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') nextDetails[items[index].productId] = result.value.data.data;
        });
        setDetails(nextDetails);
        setOrderItems(items);
      } catch {
        if (!ignore) setLoadError('주문할 상품을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
    }

    loadItems();
    refreshWallet().catch(() => {});

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, itemIdsParam, refreshCart, refreshWallet]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;

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

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  // 팝업의 useEffect가 onClose에 의존하므로 함수 고정
  const closeAddressModal = useCallback(() => setAddressModal(null), []);

  // 새 배송지 추가 팝업에서 호출: 실패하면 에러를 던져서 팝업이 메시지를 보여 줌
  const handleAddAddress = async (form) => {
    const response = await addAddress(form);
    const listResponse = await getAddresses();
    setAddresses(listResponse.data.data);
    setSelectedAddressId(response.data.data?.addressId ?? pickDefaultAddress(listResponse.data.data)?.addressId);
    setAddressModal(null);
  };

  if (isInitializing) {
    return <p className={styles.message}>불러오는 중...</p>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (loadError) {
    return <p className={styles.message}>{loadError}</p>;
  }
  if (!orderItems || !addresses) {
    return <p className={styles.message}>불러오는 중...</p>;
  }
  if (orderItems.length === 0) {
    return (
      <div className={styles.empty}>
        <p>주문할 상품이 없어요. 장바구니에서 상품을 다시 선택해 주세요.</p>
        <Link to="/cart" className={styles.outlineButton}>
          장바구니로 가기
        </Link>
      </div>
    );
  }

  const groups = groupBySeller(orderItems, details);
  const selectedAddress = addresses.find((address) => address.addressId === selectedAddressId) ?? null;
  const hasUnavailable = orderItems.some((item) => !item.isPurchasable);

  const subtotal = orderItems.reduce((sum, item) => sum + Number(item.nowPrice), 0);
  const shippingTotal = groups.length * SHIPPING_FEE_PER_SELLER;
  const total = subtotal + shippingTotal;
  const isBalanceLoaded = balance != null;
  const afterBalance = (balance ?? 0) - total;
  const isShort = isBalanceLoaded && afterBalance < 0;
  const chargeState = { from: `${location.pathname}${location.search}` }; // 충전 후 주문서로 돌아오기

  const canPay = isBalanceLoaded && !isShort && selectedAddress && !hasUnavailable && !isSubmitting;

  // 409 PRODUCT_UNAVAILABLE · PRICE_CHANGED: 서버가 모두 되돌려서 장바구니는 그대로 남음
  // 에러 응답에는 상품 정보가 없어서, 장바구니와 상품 상태를 다시 조회해 문제 상품을 모음
  const findFailedItems = async () => {
    try {
      const cart = await refreshCart();
      const orderedIds = orderItems.map((item) => item.cartItemId);
      const problems = cart.items.filter(
        (item) => orderedIds.includes(item.cartItemId) && (!item.isPurchasable || item.isChangedPrice),
      );
      // 결제 대기 / 판매완료 구분은 상품 상태로 (장바구니 응답에는 isPurchasable만 있음)
      const results = await Promise.allSettled(problems.map((item) => getProduct(item.productId)));
      return problems.map((item, index) => {
        const detail = results[index].status === 'fulfilled' ? results[index].value.data.data : details[item.productId];
        return {
          cartItemId: item.cartItemId,
          title: item.title,
          price: Number(item.nowPrice),
          cartPrice: Number(item.price),
          thumbnailUrl: detail?.imageUrls?.[0],
          status: detail?.status,
          isPurchasable: item.isPurchasable,
          isChangedPrice: item.isChangedPrice,
        };
      });
    } catch {
      return [];
    }
  };

  const handlePay = async () => {
    if (!canPay) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await createCartOrder({
        cartItemIds: orderItems.map((item) => item.cartItemId),
        recipientName: selectedAddress.recipientName,
        recipientPhone: selectedAddress.recipientPhone,
        zipcode: selectedAddress.zipcode,
        address1: selectedAddress.address1,
        address2: selectedAddress.address2,
      });
      const order = response.data.data ?? response.data;
      // 결제 결과와 관계없이 장바구니 개수·예치금 잔액 갱신
      refreshCart().catch(() => {});
      refreshWallet().catch(() => {});

      if (order.status === 'PAID') {
        navigate(`/orders/${order.orderId}/complete`, { replace: true, state: { order } });
        return;
      }
      // 버튼을 누르는 사이 잔액이 줄어든 경우: 주문은 결제 대기로 남고 상품은 잠시 예약됨
      setSubmitError('잔액이 부족해 결제하지 못했어요. 예치금을 충전한 뒤 다시 결제해 주세요.');
    } catch (error) {
      const failedItems = error.response?.status === 409 ? await findFailedItems() : [];
      if (failedItems.length > 0) {
        navigate('/checkout/fail', { replace: true, state: { items: failedItems } });
        return;
      }
      setSubmitError(error.response?.data?.message ?? '결제하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>주문서</h1>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section aria-labelledby="addr-title" className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 id="addr-title" className={styles.cardTitle}>
                배송지
              </h2>
              {addresses.length > 0 && (
                <button type="button" className={styles.outlineButton} onClick={() => setAddressModal('select')}>
                  변경
                </button>
              )}
            </div>
            {selectedAddress ? (
              <div className={styles.addressBody}>
                <div className={styles.recipientRow}>
                  <strong className={styles.recipientName}>{selectedAddress.recipientName}</strong>
                  {isDefaultAddress(selectedAddress) && <span className={styles.defaultBadge}>기본 배송지</span>}
                </div>
                <span className={styles.phone}>{maskPhone(selectedAddress.recipientPhone)}</span>
                <span className={styles.addressText}>
                  {selectedAddress.address1}
                  {selectedAddress.address2 ? `, ${selectedAddress.address2}` : ''} ({selectedAddress.zipcode})
                </span>
              </div>
            ) : (
              <div className={styles.noAddress}>
                <p>등록된 배송지가 없어요. 배송지를 추가해야 결제할 수 있어요.</p>
                <button type="button" className={styles.outlineButton} onClick={() => setAddressModal('add')}>
                  배송지 추가
                </button>
              </div>
            )}
          </section>

          <section aria-labelledby="items-title" className={styles.card}>
            <h2 id="items-title" className={styles.cardTitle}>
              주문 상품 <span className={styles.itemCount}>{orderItems.length}개</span>
            </h2>
            {groups.map((group) => (
              <div key={group.key} className={styles.group}>
                <div className={styles.groupHeader}>
                  <span className={`material-symbols-outlined ${styles.storeIcon}`} aria-hidden="true">
                    storefront
                  </span>
                  <strong className={styles.sellerName}>{group.sellerName}</strong>
                  <span className={styles.sellerLabel}>판매자</span>
                </div>
                <ul className={styles.itemList}>
                  {group.items.map((item) => (
                    <li key={item.cartItemId} className={styles.item}>
                      <span className={styles.thumb}>
                        <ProductThumbnail src={item.detail?.imageUrls?.[0]} alt="" size="small" />
                      </span>
                      <span className={styles.itemInfo}>
                        {item.detail?.species?.name && (
                          <span className={styles.species}>{item.detail.species.name}</span>
                        )}
                        <span className={styles.itemTitle}>{item.title}</span>
                        {!item.isPurchasable && (
                          <span className={styles.itemWarning}>지금은 구매할 수 없는 상품이에요</span>
                        )}
                        {item.isChangedPrice && (
                          <span className={styles.itemWarning}>
                            담을 때 {formatPrice(Number(item.price))}에서 가격이 바뀌었어요
                          </span>
                        )}
                      </span>
                      <strong className={styles.itemPrice}>{formatPrice(Number(item.nowPrice))}</strong>
                    </li>
                  ))}
                </ul>
                <div className={styles.shipRow}>
                  <span>배송비</span>
                  <span className={styles.shipFee}>{formatPrice(SHIPPING_FEE_PER_SELLER)}</span>
                </div>
              </div>
            ))}
            <p className={styles.note}>
              <span className="material-symbols-outlined" aria-hidden="true">
                local_shipping
              </span>
              결제가 끝나면 택배가 자동 접수돼요.
            </p>
          </section>
        </div>

        <aside aria-label="결제" className={styles.aside}>
          <section aria-labelledby="sum-title" className={styles.card}>
            <h2 id="sum-title" className={styles.cardTitle}>
              결제 금액
            </h2>
            <dl className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <dt>상품 금액</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className={styles.summaryRow}>
                <dt>배송비 (판매자 {groups.length}명)</dt>
                <dd>{formatPrice(shippingTotal)}</dd>
              </div>
            </dl>
            <div className={styles.divider} />
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>총 결제 금액</span>
              <strong className={styles.totalPrice}>{formatPrice(total)}</strong>
            </div>
          </section>

          <section aria-labelledby="method-title" className={styles.card}>
            <h2 id="method-title" className={styles.cardTitle}>
              결제 수단
            </h2>
            <div className={styles.method}>
              <span className={`material-symbols-outlined ${styles.methodIcon}`} aria-hidden="true">
                radio_button_checked
              </span>
              <span className={styles.methodText}>
                <strong>예치금</strong>
                <span>토스페이먼츠로 충전한 예치금으로 결제해요</span>
              </span>
            </div>
            <dl className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <dt>보유 예치금</dt>
                <dd>{isBalanceLoaded ? formatPrice(balance) : '확인 중'}</dd>
              </div>
              <div className={styles.summaryRow}>
                <dt>결제 금액</dt>
                <dd>− {formatPrice(total)}</dd>
              </div>
              <div className={styles.divider} />
              <div className={`${styles.summaryRow} ${styles.afterRow}`}>
                <dt>결제 후 잔액</dt>
                <dd className={isShort ? styles.afterShort : styles.afterEnough}>
                  {!isBalanceLoaded
                    ? '확인 중'
                    : isShort
                      ? `− ${formatPrice(-afterBalance)}`
                      : formatPrice(afterBalance)}
                </dd>
              </div>
            </dl>
            {isShort && (
              <div role="alert" className={styles.shortAlert}>
                <div className={styles.shortMessage}>
                  <span className={`material-symbols-outlined ${styles.shortIcon}`} aria-hidden="true">
                    error
                  </span>
                  <span className={styles.shortText}>
                    <strong>예치금이 {formatPrice(-afterBalance)} 부족해요</strong>
                    <span>예치금을 충전한 뒤 결제할 수 있어요.</span>
                  </span>
                </div>
                <Link to="/deposit/charge" state={chargeState} className={styles.chargeButton}>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    add_card
                  </span>
                  충전하기
                </Link>
              </div>
            )}
          </section>

          {submitError && (
            <p role="alert" className={styles.submitError}>
              {submitError}
            </p>
          )}
          {hasUnavailable && (
            <p className={styles.submitError}>
              구매할 수 없는 상품이 있어요. <Link to="/cart">장바구니</Link>에서 빼고 다시 주문해 주세요.
            </p>
          )}

          <button type="button" className={styles.payButton} disabled={!canPay} onClick={handlePay}>
            {isSubmitting ? '결제하는 중...' : `${formatPrice(total)} 결제하기`}
          </button>
          <p className={styles.payNote}>
            결제 금액은 플랫폼이 보관하고, 구매 확정 후 판매자에게 정산돼요. 배송 완료 3일 뒤에는 자동으로 구매
            확정돼요.
          </p>
        </aside>
      </div>

      {addressModal === 'select' && (
        <AddressSelectModal
          addresses={addresses}
          selectedId={selectedAddressId}
          onSelect={(addressId) => {
            setSelectedAddressId(addressId);
            setAddressModal(null);
          }}
          onAddNew={() => setAddressModal('add')}
          onClose={closeAddressModal}
        />
      )}
      {addressModal === 'add' && <AddressModal onSubmit={handleAddAddress} onClose={closeAddressModal} />}
    </div>
  );
}

export default CheckoutPage;
