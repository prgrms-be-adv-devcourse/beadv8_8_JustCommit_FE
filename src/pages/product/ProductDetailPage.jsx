import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import usePageTitle from '../../hooks/usePageTitle';
import { getProduct } from '../../api/productApi';
import {
  PRODUCT_STATUS,
  SPECIES_DIFFICULTY,
  SPECIES_LIGHT,
  SPECIES_WATERING,
} from '../../constants/product';
import { formatPrice } from '../../utils/format';
import ConfirmModal from '../../components/common/ConfirmModal';
import ProductThumbnail from '../../components/product/ProductThumbnail';
import styles from './ProductDetailPage.module.css';

const BLOCKED_TEXT = {
  PAYMENT_PENDING: '결제 대기 중인 상품이라 지금은 구매할 수 없어요.',
  SOLD_OUT: '판매가 완료된 상품이에요.',
};

// 2026-10-13T... → 2026년 10월 13일
function formatDate(value) {
  const date = new Date(value);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function ProductDetail({ productId }) {
  usePageTitle('상품 상세');
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | done | hidden | error
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    let ignore = false;

    getProduct(productId)
      .then((response) => {
        if (ignore) return;
        setProduct(response.data.data);
        setLoadState('done');
      })
      .catch((error) => {
        if (ignore) return;
        // 403 PRODUCT_HIDDEN: 판매자가 숨긴 상품을 본인이 아닌 사람이 조회 (삭제된 상품은 404)
        setLoadState(error.response?.data?.code === 'PRODUCT_HIDDEN' ? 'hidden' : 'error');
      });

    return () => {
      ignore = true;
    };
  }, [productId]);

  // 등록·수정 후엔 메인(backTo), 목록에서 왔으면 뒤로가기(필터 유지), 직접 접속이면 홈
  const backTo = location.state?.backTo?.startsWith('/') ? location.state.backTo : null;
  const goBack = () => {
    if (backTo) navigate(backTo);
    else if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  // 비로그인: '로그인하러 갈까요?' 팝업 → 확인하면 로그인 후 이 상품으로 돌아옴
  const [loginPrompt, setLoginPrompt] = useState(null); // 팝업 문구, null이면 닫힘
  const goToLogin = (message) => setLoginPrompt(message);
  const confirmLogin = () => navigate('/login', { state: { from: location.pathname } });

  const { addToCart, refreshCart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartAddedOpen, setCartAddedOpen] = useState(false); // 담기 성공 팝업
  // ConfirmModal의 useEffect가 onClose에 의존하므로 매 렌더링마다 새 함수가 되지 않게 고정
  const closeCartAdded = useCallback(() => setCartAddedOpen(false), []);
  const goToCart = () => navigate('/cart');
  const [cartError, setCartError] = useState(null); // 실패 팝업 { title, message } (null이면 닫힘)
  const closeCartError = useCallback(() => setCartError(null), []);

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      goToLogin('로그인 후 장바구니에 담을 수 있어요.');
      return;
    }
    if (isAddingToCart) return; // 연속 클릭으로 같은 요청이 두 번 가는 것 방지

    setIsAddingToCart(true);
    try {
      await addToCart(product.productId);
      setCartAddedOpen(true);
    } catch (error) {
      // 백엔드 메시지 예: "이미 추가된 상품입니다.", "구매가 불가능한 상품입니다."
      setCartError({
        title: '장바구니에 담지 못했어요',
        message: error.response?.data?.message ?? '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  // 바로 구매: 주문 API가 장바구니 항목 기준이라, 장바구니에 담은 뒤 그 항목 하나로 주문서 이동
  // TODO: 바로 구매 API가 생기면 교체
  const handleBuy = async () => {
    if (!isLoggedIn) {
      goToLogin('로그인 후 구매할 수 있어요.');
      return;
    }
    if (isAddingToCart) return;

    setIsAddingToCart(true);
    try {
      let cartItemId;
      try {
        cartItemId = await addToCart(product.productId);
      } catch (error) {
        // 이미 담은 상품이면 기존 장바구니 항목으로 주문
        const latestCart = await refreshCart().catch(() => null);
        cartItemId = latestCart?.items.find((item) => item.productId === product.productId)?.cartItemId;
        if (!cartItemId) throw error;
      }
      navigate(`/checkout?items=${cartItemId}`);
    } catch (error) {
      setCartError({
        title: '주문서로 이동하지 못했어요',
        message: error.response?.data?.message ?? '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loadState === 'loading') {
    return <p className={styles.message}>상품을 불러오는 중...</p>;
  }

  if (loadState === 'hidden') {
    // 주문 내역에서 들어왔으면 주문에 저장된 상품명·가격(스냅샷)을 함께 표시
    const orderItem = location.state?.orderItem;
    return (
      <div className={styles.message}>
        <span className={`material-symbols-outlined ${styles.hiddenIcon}`} aria-hidden="true">
          visibility_off
        </span>
        <p className={styles.hiddenTitle}>판매자가 비공개 처리한 상품입니다</p>
        {orderItem && (
          <div className={styles.snapshot}>
            <span className={styles.snapshotLabel}>주문한 상품</span>
            <strong>{orderItem.productName}</strong>
            <span>{formatPrice(Number(orderItem.price))}</span>
          </div>
        )}
        {orderItem ? (
          <button type="button" className={styles.textLink} onClick={goBack}>
            주문 상세로 돌아가기
          </button>
        ) : (
          <Link to="/">목록으로</Link>
        )}
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className={styles.message}>
        <p>상품을 찾을 수 없거나 불러오지 못했습니다.</p>
        <Link to="/">목록으로</Link>
      </div>
    );
  }

  const images = product.imageUrls ?? [];
  // 화면 표시용 판단 (실제 수정 권한은 백엔드가 본인 상품인지 검사)
  const isOwner = isLoggedIn && user?.memberId === product.sellerId;
  const currentImage = images[selected];
  const status = PRODUCT_STATUS[product.status] ?? { label: product.status, tone: 'pending' };
  const isAvailable = product.status === 'ACTIVE';
  const isSoldOut = product.status === 'SOLD_OUT';
  const { species } = product;

  const careItems = [
    { label: '광량', value: SPECIES_LIGHT[species?.light] },
    { label: '물주기', value: SPECIES_WATERING[species?.watering] },
    { label: '난이도', value: SPECIES_DIFFICULTY[species?.difficulty] },
  ].filter((item) => item.value);

  return (
    <div className={styles.page}>
      <button type="button" className={styles.backLink} onClick={goBack}>
        <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        목록으로
      </button>

      <div className={styles.top}>
        <section aria-label="상품 사진" className={styles.gallery}>
          <div className={`${styles.mainPhoto} ${isSoldOut ? styles.soldOutPhoto : ''}`}>
            <ProductThumbnail
              src={currentImage}
              alt={`${product.title} 사진 ${selected + 1}`}
            />
            {images.length > 0 && (
              <span className={styles.counter}>
                {selected + 1} / {images.length}
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className={styles.thumbs}>
              {images.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  aria-label={`사진 ${index + 1} 보기`}
                  aria-pressed={index === selected}
                  className={`${styles.thumb} ${index === selected ? styles.thumbSelected : ''}`}
                  onClick={() => setSelected(index)}
                >
                  <ProductThumbnail src={url} alt="" size="small" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="product-title" className={styles.info}>
          <div className={styles.heading}>
            <div className={styles.chips}>
              {species?.name && <span className={styles.speciesChip}>{species.name}</span>}
              <span className={`${styles.statusBadge} ${styles[status.tone]}`}>{status.label}</span>
            </div>
            <h1 id="product-title" className={styles.title}>{product.title}</h1>
            <p className={styles.price}>{formatPrice(product.price)}</p>
          </div>

          <div className={styles.seller}>
            <span className={styles.avatar} aria-hidden="true">
              {product.sellerName?.charAt(0)}
            </span>
            <div className={styles.sellerText}>
              <span className={styles.sellerLabel}>판매자</span>
              <strong className={styles.sellerName}>{product.sellerName}</strong>
            </div>
          </div>

          <dl className={styles.details}>
            <dt>거래 방식</dt>
            <dd>택배 거래 · 결제가 끝나면 택배가 자동 접수돼요</dd>
            {product.heightCm && (
              <>
                <dt>키</dt>
                <dd>{product.heightCm}cm</dd>
              </>
            )}
            {product.potSize && (
              <>
                <dt>화분 크기</dt>
                <dd>{product.potSize}</dd>
              </>
            )}
            <dt>등록일</dt>
            <dd>{formatDate(product.createdAt)}</dd>
          </dl>

          {cartAddedOpen && (
            <ConfirmModal
              icon="shopping_cart"
              title="장바구니에 담았어요"
              message="장바구니로 이동할까요?"
              confirmText="장바구니 보기"
              cancelText="계속 둘러보기"
              onConfirm={goToCart}
              onClose={closeCartAdded}
            />
          )}

          {cartError && (
            <ConfirmModal
              icon="info"
              title={cartError.title}
              message={cartError.message}
              confirmText="확인"
              cancelText={null}
              onConfirm={closeCartError}
              onClose={closeCartError}
            />
          )}

          {isOwner ? (
            <div className={styles.actions}>
              <Link
                to={`/products/${product.productId}/edit`}
                className={`${styles.buyButton} ${styles.editLink}`}
              >
                <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                상품 수정
              </Link>
            </div>
          ) : isAvailable ? (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.buyButton}
                onClick={handleBuy}
                disabled={isAddingToCart}
              >
                바로 구매
              </button>
              <button
                type="button"
                className={styles.cartButton}
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                <span className="material-symbols-outlined" aria-hidden="true">add_shopping_cart</span>
                {isAddingToCart ? '담는 중...' : '장바구니 담기'}
              </button>
            </div>
          ) : (
            <div className={styles.blocked}>
              <div className={styles.actions}>
                <button type="button" disabled className={styles.buyButtonDisabled}>
                  바로 구매
                </button>
                <button type="button" disabled className={styles.cartButtonDisabled}>
                  <span className="material-symbols-outlined" aria-hidden="true">add_shopping_cart</span>
                  장바구니 담기
                </button>
              </div>
              <p className={styles.blockedText}>
                <span className="material-symbols-outlined" aria-hidden="true">info</span>
                {BLOCKED_TEXT[product.status] ?? '지금은 구매할 수 없는 상품이에요.'}
              </p>
            </div>
          )}

          <div className={styles.notice}>
            <span className="material-symbols-outlined" aria-hidden="true">lock</span>
            <div className={styles.noticeText}>
              <strong>예치금으로 결제하고, 구매 확정 후 판매자에게 정산돼요</strong>
              <span>배송 완료 3일 뒤에는 자동으로 구매 확정돼요.</span>
            </div>
          </div>
        </section>
      </div>

      <section aria-labelledby="desc-title" className={styles.section}>
        <h2 id="desc-title" className={styles.sectionTitle}>상품 설명</h2>
        <p className={styles.description}>{product.description}</p>
      </section>

      {(product.growNote || careItems.length > 0) && (
        <section aria-labelledby="care-title" className={styles.section}>
          <h2 id="care-title" className={styles.sectionTitle}>키우기 정보</h2>
          {product.growNote && <p className={styles.description}>{product.growNote}</p>}
          {careItems.length > 0 && (
            <ul className={styles.careList}>
              {careItems.map((item) => (
                <li key={item.label} className={styles.careItem}>
                  <span className={styles.careLabel}>{item.label}</span>
                  <span className={styles.careValue}>{item.value}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {loginPrompt && (
        <ConfirmModal
          title="로그인이 필요해요"
          message={`${loginPrompt}\n로그인하러 갈까요?`}
          confirmText="로그인하기"
          onConfirm={confirmLogin}
          onClose={() => setLoginPrompt(null)}
        />
      )}
    </div>
  );
}

function ProductDetailPage() {
  const { productId } = useParams();
  // 상품이 바뀌면 key가 달라져 컴포넌트를 새로 만듦
  // → 로딩 상태('loading')와 선택한 사진(0)이 처음 값으로 자동 초기화
  return <ProductDetail key={productId} productId={productId} />;
}

export default ProductDetailPage;
