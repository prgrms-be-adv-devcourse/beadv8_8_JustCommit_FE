import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { changeProductHidden, deleteProduct, getMyProductCounts, getMyProducts } from '../../api/productApi';
import { EDITABLE_PRODUCT_STATUSES, toQuota } from '../../constants/seller';
import ErrorPage from '../../components/common/ErrorPage';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatPrice } from '../../utils/format';
import MyListingsView from './MyListingsView';
import { DECIDED_BY_LABEL, rejectReasonText, toReviewStage } from './reviewStatusModel';

const TABS = [
  { value: '', label: '전체' },
  { value: 'ACTIVE', label: '판매 중' },
  { value: 'PAYMENT_PENDING', label: '거래 중' },
  { value: 'SOLD_OUT', label: '판매 완료' },
  { value: 'REVIEW_PENDING', label: '검수 중' },
  { value: 'REJECTED', label: '반려' },
  { value: 'HIDDEN', label: '숨김' },
];

const PAGE_SIZE = 50; // 백엔드 PagingRequest.MAX_SIZE
const MAX_PAGES = 10; // 안전장치: 최대 500개까지

// 내 상품을 전부 받아서 탭과 탭 개수를 프론트에서 계산 (삭제된 상품은 백엔드가 제외)
// 숨기기 · 삭제 뒤 개수가 바로 맞도록 목록에서 셈. 오늘 등록 · 사진 검수 횟수만 counts API로 받음
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

function matchesTab(product, tab) {
  if (!tab) return true;
  if (tab === 'HIDDEN') return product.hidden;
  return product.status === tab;
}

// 상품 응답 → 목록 한 줄. 검수 배지는 응답의 reviewStatus · decidedBy · rejectReason · rejectMessage (BE MyProductResponse)
// TODO: 주문 취소로 돌아온 상품 여부(returnedFromOrder)는 응답에 없어 안내 문구가 안 보임
function toRow(product) {
  const { status } = product;
  const row = {
    productId: product.productId,
    title: product.title,
    priceText: formatPrice(product.price),
    thumbnailUrl: product.thumbnailUrl ?? null,
    badges: [status],
    note: null,
    link: null,
    // 시안 08-4-1: 거래 중 · 판매 완료 줄은 「숨기기」만, 나머지는 수정 · 숨기기 · 삭제
    hasEditDelete: EDITABLE_PRODUCT_STATUSES.includes(status),
    canEdit: EDITABLE_PRODUCT_STATUSES.includes(status),
    canDelete: EDITABLE_PRODUCT_STATUSES.includes(status),
    // 숨김은 상태와 별개라 모든 상태에서 숨기거나 풀 수 있음 (BE docs services/product.md 「숨김」)
    hideAction: product.hidden ? 'unhide' : 'hide',
  };
  const reviewLink = { label: '결과 보기', to: `/products/${product.productId}/review` };

  const stage = toReviewStage(product, status);

  if (status === 'REVIEW_PENDING') {
    if (stage === 'MANUAL') {
      row.badges = ['MANUAL'];
      row.note = '관리자가 확인하고 있어요. 결과는 알림으로 알려 드려요';
    } else if (stage === 'DELAYED') {
      row.badges = ['DELAYED'];
      row.note = '확인에 시간이 걸리고 있어요';
      // 시안 08-4-1: 확인 지연 상품은 수정 · 삭제 버튼을 막아 둠
      row.canEdit = false;
      row.canDelete = false;
    } else {
      row.note = '사진을 확인하고 있어요. 보통 몇 초면 끝나요';
    }
    row.link = reviewLink;
  } else if (status === 'REJECTED') {
    const decidedBy = DECIDED_BY_LABEL[product.decidedBy];
    row.note = decidedBy ? `${rejectReasonText(product)} · ${decidedBy}` : rejectReasonText(product);
    row.link = {
      // 이의 신청은 자동 반려만 (가능 여부는 결과 화면에서 다시 확인)
      label: stage === 'REJECTED' ? '사유 보기 · 이의 신청' : '사유 보기',
      to: reviewLink.to,
    };
  } else if (product.hidden) {
    row.badges = [status, 'HIDDEN'];
    if (product.returnedFromOrder) {
      row.note = '주문이 취소돼 돌아온 상품이에요. 상태를 확인하고 숨김을 풀면 바로 판매돼요';
    }
  }
  return row;
}

function MyProductsPage() {
  usePageTitle('내 판매 목록');
  const navigate = useNavigate();
  const { user, isLoggedIn, isInitializing } = useAuth();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [products, setProducts] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error
  const [tab, setTab] = useState('');
  const [busyId, setBusyId] = useState(null); // 숨기기 · 삭제 요청 중인 상품
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notice, setNotice] = useState(null); // 실패 안내 문구
  const [counts, setCounts] = useState(null); // 오늘 등록 · 사진 검수 횟수 (GET products/me/counts)

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

    // 등록 제한 줄은 실패해도 목록은 보여 줌 (「-」로 표시)
    getMyProductCounts()
      .then((response) => {
        if (!ignore) setCounts(response.data.data);
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [canSell]);

  // Modal의 useEffect가 onClose에 의존하므로 함수 고정
  const closeDelete = useCallback(() => setDeleteTarget(null), []);
  const closeNotice = useCallback(() => setNotice(null), []);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/mypage/products' }} />;
  if (!canSell) return <Navigate to="/seller/register" replace />;
  if (loadState === 'loading') return <main className="flex-1" />;
  if (loadState === 'error') return <ErrorPage type="SERVER_ERROR" />;

  const toggleHidden = async (row) => {
    const hidden = row.hideAction === 'hide';
    setBusyId(row.productId);
    try {
      await changeProductHidden(row.productId, hidden);
      // 성공하면 그 상품만 바꿔서 배지 · 개수가 바로 반영되게
      setProducts((prev) =>
        prev.map((item) => (item.productId === row.productId ? { ...item, hidden } : item)),
      );
    } catch (error) {
      setNotice(error.response?.data?.message ?? '숨김 상태를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.');
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
      setNotice(error.response?.data?.message ?? '상품을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusyId(null);
    }
  };

  const tabs = TABS.map((item) => ({
    ...item,
    count: products.filter((product) => matchesTab(product, item.value)).length,
  }));
  const rows = products.filter((product) => matchesTab(product, tab)).map(toRow);

  return (
    <MyListingsView
      quota={toQuota(counts)}
      tabs={tabs}
      tab={tab}
      onTabChange={setTab}
      rows={rows}
      isEmptyAll={products.length === 0}
      busyId={busyId}
      onEdit={(row) => navigate(`/products/${row.productId}/edit`)}
      onToggleHidden={toggleHidden}
      onDelete={setDeleteTarget}
      deleteTarget={deleteTarget}
      onDeleteCancel={closeDelete}
      onDeleteConfirm={confirmDelete}
      notice={notice}
      onNoticeClose={closeNotice}
    />
  );
}

export default MyProductsPage;
