import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
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

function ProductDetailPage() {
  usePageTitle('상품 상세');
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  const [product, setProduct] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    let ignore = false;
    setLoadState('loading');
    setSelected(0);

    getProduct(productId)
      .then((response) => {
        if (ignore) return;
        setProduct(response.data.data);
        setLoadState('done');
      })
      .catch(() => {
        if (!ignore) setLoadState('error');
      });

    return () => {
      ignore = true;
    };
  }, [productId]);

  // 목록에서 들어왔으면 뒤로가기(필터 유지), 주소로 바로 들어왔으면 홈으로
  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  // 비로그인: '로그인하러 갈까요?' 팝업 → 확인하면 로그인 후 이 상품으로 돌아옴
  const [loginPrompt, setLoginPrompt] = useState(null); // 팝업 문구, null이면 닫힘
  const goToLogin = (message) => setLoginPrompt(message);
  const confirmLogin = () => navigate('/login', { state: { from: location.pathname } });

  const handleBuy = () => {
    if (!isLoggedIn) {
      goToLogin('로그인 후 구매할 수 있어요.');
      return;
    }
    navigate(`/orders/new?productId=${product.productId}`);
  };

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      goToLogin('로그인 후 장바구니에 담을 수 있어요.');
      return;
    }
    // TODO: 장바구니 요청 형식 확인 후 POST /api/v1/cart/items 연결
    alert('장바구니 담기는 준비 중입니다.');
  };

  if (loadState === 'loading') {
    return <p className={styles.message}>상품을 불러오는 중...</p>;
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
            {currentImage ? (
              <img src={currentImage} alt={`${product.title} 사진 ${selected + 1}`} />
            ) : (
              <span className={`material-symbols-outlined ${styles.placeholderIcon}`} aria-hidden="true">
                potted_plant
              </span>
            )}
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
                  <img src={url} alt="" />
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

          {isAvailable ? (
            <div className={styles.actions}>
              <button type="button" className={styles.buyButton} onClick={handleBuy}>
                바로 구매
              </button>
              <button type="button" className={styles.cartButton} onClick={handleAddToCart}>
                <span className="material-symbols-outlined" aria-hidden="true">add_shopping_cart</span>
                장바구니 담기
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

export default ProductDetailPage;
