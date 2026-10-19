import { useEffect, useState } from 'react';
import BackLink from '../../components/common/BackLink';
import { Link, Navigate } from 'react-router-dom';
import { getOrders } from '../../api/orderApi';
import ProductThumbnail from '../../components/product/ProductThumbnail';
import { ORDER_STATUS } from '../../constants/order';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate, formatPrice } from '../../utils/format';
import styles from './OrderListPage.module.css';

// 탭별로 묶는 주문 상태. 결제 대기는 "전체"에서만 보인다 (주문서에서 잔액 부족을 미리 막아 거의 생기지 않음)
const TABS = [
  { value: 'ALL', label: '전체', statuses: null },
  { value: 'PAID', label: '결제 완료', statuses: ['PAID'] },
  { value: 'COMPLETED', label: '거래 완료', statuses: ['COMPLETED'] },
  { value: 'CLOSED', label: '취소', statuses: ['CANCELLED', 'EXPIRED', 'PAYMENT_FAILED'] },
];

const PAGE_SIZE = 50; // 백엔드 PagingRequest.MAX_SIZE
const MAX_PAGES = 10; // 안전장치: 최대 500건까지

// TODO: 백엔드에 상태 조건·탭별 개수 조회가 생기면 페이지 단위 조회로 교체
// 지금은 주문 목록 API에 상태 필터가 없어서 전부 받아 탭과 개수를 프론트에서 계산
async function fetchAllOrders() {
  const all = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await getOrders({ page, size: PAGE_SIZE });
    const data = response.data.data ?? response.data; // 주문 API는 DTO를 그대로 반환
    all.push(...data.content);
    if (page + 1 >= data.totalPages) break;
  }
  return all;
}

function matchesTab(order, tab) {
  return !tab.statuses || tab.statuses.includes(order.status);
}

function OrderListPage() {
  usePageTitle('주문 내역');
  const { isLoggedIn, isInitializing } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error
  const [tabValue, setTabValue] = useState('ALL');

  useEffect(() => {
    if (!isLoggedIn) return undefined;

    let ignore = false;
    fetchAllOrders()
      .then((list) => {
        if (ignore) return;
        setOrders(list);
        setLoadState('done');
      })
      .catch(() => {
        if (!ignore) setLoadState('error');
      });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  if (isInitializing) {
    return <p className={styles.message}>불러오는 중...</p>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/orders' }} />;
  }

  const tab = TABS.find((item) => item.value === tabValue);
  const visibleOrders = orders.filter((order) => matchesTab(order, tab));

  const renderBody = () => {
    if (loadState === 'loading') {
      return <p className={styles.message}>주문 내역을 불러오는 중...</p>;
    }
    if (loadState === 'error') {
      return (
        <p className={styles.message}>주문 내역을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      );
    }
    if (visibleOrders.length === 0) {
      return (
        <div className={styles.empty}>
          <span className={`material-symbols-outlined ${styles.emptyIcon}`} aria-hidden="true">
            receipt_long
          </span>
          <h2 className={styles.emptyTitle}>
            {orders.length === 0 ? '아직 주문한 식물이 없어요' : '이 상태의 주문이 없어요'}
          </h2>
          <p className={styles.emptyText}>마음에 드는 식물을 찾아 첫 주문을 해 보세요.</p>
          <Link to="/" className={styles.primaryLink}>
            식물 둘러보기
          </Link>
        </div>
      );
    }

    return (
      <ul className={styles.list}>
        {visibleOrders.map((order) => {
          const status = ORDER_STATUS[order.status] ?? { label: order.status, tone: 'closed' };
          const moreCount = (order.itemCount ?? 1) - 1;

          return (
            <li key={order.orderId}>
              <Link to={`/orders/${order.orderId}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <strong className={styles.date}>{formatDate(order.createdAt)}</strong>
                  <span className={styles.orderNo}>주문 번호 {order.orderNo}</span>
                  <span className={`${styles.badge} ${styles[status.tone]}`}>{status.label}</span>
                </div>

                <div className={styles.cardBody}>
                  {/* 대표 상품 사진. 없으면(사진 없는 상품·삭제된 상품) 대체 썸네일 */}
                  <span className={`${styles.thumb} ${status.muted ? styles.muted : ''}`}>
                    <ProductThumbnail src={order.thumbnailUrl} alt="" size="small" />
                  </span>
                  <span className={styles.summary}>
                    <span className={styles.itemName}>
                      {order.representativeItemName}
                      {moreCount > 0 && <span className={styles.more}> 외 {moreCount}건</span>}
                    </span>
                    <span className={styles.amountLabel}>
                      결제 금액
                      <strong className={styles.amount}>
                        {formatPrice(Number(order.totalAmount))}
                      </strong>
                    </span>
                  </span>
                  <span className={styles.detailLink}>
                    주문 상세
                    <span className="material-symbols-outlined" aria-hidden="true">
                      chevron_right
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={styles.page}>
      <BackLink to="/mypage" label="마이페이지" />
      <h1 className={styles.heading}>주문 내역</h1>

      <div role="tablist" aria-label="주문 상태" className={styles.tabs}>
        {TABS.map((item) => {
          const isSelected = tabValue === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`${styles.tab} ${isSelected ? styles.tabSelected : ''}`}
              onClick={() => setTabValue(item.value)}
            >
              {item.label}
              {loadState === 'done' && (
                <span className={styles.tabCount}>
                  {orders.filter((order) => matchesTab(order, item)).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {renderBody()}
    </div>
  );
}

export default OrderListPage;
