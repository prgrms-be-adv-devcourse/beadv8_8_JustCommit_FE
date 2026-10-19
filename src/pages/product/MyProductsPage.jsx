import { useCallback, useEffect, useState } from 'react';
import BackLink from '../../components/common/BackLink';
import { Link, Navigate } from 'react-router-dom';
import { changeProductHidden, deleteProduct, getMyProducts } from '../../api/productApi';
import ConfirmModal from '../../components/common/ConfirmModal';
import ProductThumbnail from '../../components/product/ProductThumbnail';
import { PRODUCT_STATUS } from '../../constants/product';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatPrice } from '../../utils/format';
import styles from './MyProductsPage.module.css';

const TABS = [
  { value: '', label: '전체' },
  { value: 'ACTIVE', label: '판매중' },
  { value: 'PAYMENT_PENDING', label: '결제 대기' },
  { value: 'SOLD_OUT', label: '판매완료' },
];

const PAGE_SIZE = 50; // 백엔드 PagingRequest.MAX_SIZE
const MAX_PAGES = 10; // 안전장치: 최대 500개까지

// TODO: 백엔드에 hidden 조회 조건·탭별 개수 API가 생기면 페이지 단위 조회로 교체
// 지금은 내 상품을 전부 받아서 탭·숨김 필터와 개수를 프론트에서 계산 (삭제된 상품은 백엔드가 제외)
async function fetchAllMyProducts() {
  const all = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await getMyProducts({ page, size: PAGE_SIZE });
    const data = response.data.data;
    all.push(...data.content);
    if (page + 1 >= data.totalPages) break;
  }
  return all;
}

// 수정·삭제는 판매중일 때만 가능 (백엔드 Product.update·delete 규칙)
function isLocked(product) {
  return product.status !== 'ACTIVE';
}

// 행 아래 안내 문구
function getRowHint(product) {
  if (product.status === 'PAYMENT_PENDING') return '결제 대기 중이라 수정·삭제할 수 없어요';
  if (product.status === 'SOLD_OUT') return '판매가 끝난 상품은 수정·삭제할 수 없어요';
  if (product.hidden) return '숨긴 상품은 구매자에게 보이지 않아요';
  return null;
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message ?? fallback;
}

function MyProductsPage() {
  usePageTitle('내 판매 목록');
  const { user, isLoggedIn, isInitializing } = useAuth();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [products, setProducts] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error
  const [tab, setTab] = useState('');
  const [hiddenOnly, setHiddenOnly] = useState(false);
  const [busyId, setBusyId] = useState(null); // 숨기기·삭제 요청 중인 상품
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notice, setNotice] = useState(null); // 실패 안내 팝업 문구

  useEffect(() => {
    if (!canSell) return undefined;

    let ignore = false;
    fetchAllMyProducts()
      .then((list) => {
        if (ignore) return;
        setProducts(list);
        setLoadState('done');
      })
      .catch(() => {
        if (!ignore) setLoadState('error');
      });

    return () => {
      ignore = true;
    };
  }, [canSell]);

  // ConfirmModal의 useEffect가 onClose에 의존하므로 함수 고정
  const closeDelete = useCallback(() => setDeleteTarget(null), []);
  const closeNotice = useCallback(() => setNotice(null), []);

  if (isInitializing) {
    return <p className={styles.message}>불러오는 중...</p>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/mypage/products' }} />;
  }
  if (!canSell) {
    return <Navigate to="/seller/register" replace />;
  }

  // 토글을 켜면 탭 개수도 숨긴 상품 기준
  const baseProducts = hiddenOnly ? products.filter((product) => product.hidden) : products;
  const countOf = (status) =>
    status ? baseProducts.filter((product) => product.status === status).length : baseProducts.length;
  const visibleProducts = tab ? baseProducts.filter((product) => product.status === tab) : baseProducts;

  const toggleHidden = async (product) => {
    setBusyId(product.productId);
    try {
      await changeProductHidden(product.productId, !product.hidden);
      // 성공하면 그 상품만 바꿔서 배지·개수가 바로 반영되게
      setProducts((prev) =>
        prev.map((item) =>
          item.productId === product.productId ? { ...item, hidden: !product.hidden } : item,
        ),
      );
    } catch (error) {
      setNotice(getErrorMessage(error, '숨김 상태를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    setBusyId(target.productId);
    try {
      await deleteProduct(target.productId);
      setProducts((prev) => prev.filter((item) => item.productId !== target.productId));
    } catch (error) {
      setNotice(getErrorMessage(error, '상품을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setBusyId(null);
    }
  };

  const renderBody = () => {
    if (loadState === 'loading') {
      return <p className={styles.message}>내 상품을 불러오는 중...</p>;
    }
    if (loadState === 'error') {
      return <p className={styles.message}>내 판매 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>;
    }
    if (visibleProducts.length === 0) {
      return (
        <div className={styles.empty}>
          <p>
            {hiddenOnly
              ? '숨긴 상품이 없어요'
              : tab
                ? '이 상태의 상품이 없어요'
                : '아직 등록한 상품이 없어요'}
          </p>
          {products.length === 0 && (
            <Link to="/products/new" className={styles.createLink}>
              첫 상품 등록하기
            </Link>
          )}
        </div>
      );
    }

    return (
      <ul className={styles.list}>
        {visibleProducts.map((product) => {
          const status = PRODUCT_STATUS[product.status] ?? { label: product.status, tone: 'pending' };
          const locked = isLocked(product);
          const isBusy = busyId === product.productId;
          const hint = getRowHint(product);

          return (
            <li key={product.productId} className={styles.row}>
              <Link to={`/products/${product.productId}`} className={styles.thumb} aria-hidden="true" tabIndex={-1}>
                <ProductThumbnail src={product.thumbnailUrl} alt="" size="small" />
              </Link>

              <div className={styles.info}>
                <div className={styles.badges}>
                  <span className={`${styles.badge} ${styles[status.tone]}`}>{status.label}</span>
                  {product.hidden && <span className={`${styles.badge} ${styles.hiddenBadge}`}>숨김</span>}
                </div>
                <Link to={`/products/${product.productId}`} className={styles.title}>
                  {product.title}
                </Link>
                <strong className={styles.price}>{formatPrice(Number(product.price))}</strong>
                {hint && <p className={styles.hint}>{hint}</p>}
              </div>

              <div className={styles.actions}>
                {locked ? (
                  <button type="button" className={styles.actionButton} disabled>
                    수정
                  </button>
                ) : (
                  <Link to={`/products/${product.productId}/edit`} className={styles.actionButton}>
                    수정
                  </Link>
                )}
                <button
                  type="button"
                  className={styles.actionButton}
                  disabled={isBusy}
                  onClick={() => toggleHidden(product)}
                >
                  {product.hidden ? '숨김 해제' : '숨기기'}
                </button>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.danger}`}
                  disabled={locked || isBusy}
                  onClick={() => setDeleteTarget(product)}
                >
                  삭제
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={styles.page}>
      <BackLink to="/mypage" label="마이페이지" />
      <div className={styles.header}>
        <h1 className={styles.heading}>내 판매 목록</h1>
        <Link to="/products/new" className={styles.createLink}>
          + 상품 등록
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div role="tablist" aria-label="판매 상태" className={styles.tabs}>
          {TABS.map((item) => {
            const isSelected = tab === item.value;
            return (
              <button
                key={item.value || 'all'}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`${styles.tab} ${isSelected ? styles.tabSelected : ''}`}
                onClick={() => setTab(item.value)}
              >
                {item.label}
                {loadState === 'done' && <span className={styles.tabCount}>{countOf(item.value)}</span>}
              </button>
            );
          })}
        </div>
        <label className={styles.hiddenToggle}>
          <input
            type="checkbox"
            role="switch"
            checked={hiddenOnly}
            onChange={(event) => setHiddenOnly(event.target.checked)}
          />
          숨긴 상품만 보기
        </label>
      </div>

      {renderBody()}

      {deleteTarget && (
        <ConfirmModal
          icon="delete"
          title="상품을 삭제할까요?"
          message={`"${deleteTarget.title}"이(가) 목록과 검색에서 사라지고 되돌릴 수 없어요.`}
          confirmText="삭제"
          cancelText="취소"
          onConfirm={confirmDelete}
          onClose={closeDelete}
        />
      )}

      {notice && (
        <ConfirmModal
          icon="info"
          title="처리하지 못했어요"
          message={notice}
          confirmText="확인"
          cancelText={null}
          onConfirm={closeNotice}
          onClose={closeNotice}
        />
      )}
    </div>
  );
}

export default MyProductsPage;
