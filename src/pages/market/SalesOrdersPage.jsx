import { useEffect, useState } from 'react';
import BackLink from '../../components/common/BackLink';
import { Link, Navigate } from 'react-router-dom';
import SalesStatusBadge from '../../components/market/SalesStatusBadge';
import ProductThumbnail from '../../components/product/ProductThumbnail';
import { getSalesStatus } from '../../constants/order';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDate, formatPrice } from '../../utils/format';
import { fetchSalesOrders } from './salesOrderLoader';
import styles from './SalesOrdersPage.module.css';

const TABS = [
  { value: '', label: '전체' },
  { value: 'PREPARING', label: '배송 준비' },
  { value: 'SHIPPING', label: '배송 중' },
  { value: 'DELIVERED', label: '배송 완료' },
  { value: 'CONFIRMED', label: '구매 확정' },
];

// "몬스테라 델리시오사 외 2건"
function getItemName(order) {
  const name = order.representativeItemName ?? '상품';
  return order.itemCount > 1 ? `${name} 외 ${order.itemCount - 1}건` : name;
}

function SalesOrdersPage() {
  usePageTitle('판매 주문 목록');
  const { user, isLoggedIn, isInitializing } = useAuth();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [orders, setOrders] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error
  const [tab, setTab] = useState('');

  useEffect(() => {
    if (!canSell) return undefined;

    let ignore = false;
    // TODO: 백엔드에 배송 상태 조회 조건·탭별 개수가 생기면 페이지 단위 조회로 교체
    fetchSalesOrders()
      .then((list) => {
        if (ignore) return;
        setOrders(list.map((order) => ({ ...order, salesStatus: getSalesStatus(order) })));
        setLoadState('done');
      })
      .catch(() => {
        if (!ignore) setLoadState('error');
      });

    return () => {
      ignore = true;
    };
  }, [canSell]);

  if (isInitializing) {
    return <p className={styles.message}>불러오는 중...</p>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/orders/seller' }} />;
  }
  if (!canSell) {
    return <Navigate to="/seller/register" replace />;
  }

  const countOf = (status) =>
    status ? orders.filter((order) => order.salesStatus === status).length : orders.length;
  const visibleOrders = tab ? orders.filter((order) => order.salesStatus === tab) : orders;
  const currentTab = TABS.find((item) => item.value === tab) ?? TABS[0];

  const renderBody = () => {
    if (loadState === 'loading') {
      return <p className={styles.message}>판매 주문을 불러오는 중...</p>;
    }
    if (loadState === 'error') {
      return (
        <p className={styles.message}>판매 주문을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      );
    }
    if (visibleOrders.length === 0) {
      return (
        <div className={styles.empty}>
          <span className={`material-symbols-outlined ${styles.emptyIcon}`} aria-hidden="true">
            local_shipping
          </span>
          <h3 className={styles.emptyTitle}>
            {tab ? `${currentTab.label} 주문이 없어요` : '아직 들어온 주문이 없어요'}
          </h3>
          <p className={styles.emptyText}>
            {tab ? '다른 상태의 주문을 확인해 보세요.' : '상품이 판매되면 여기에 주문이 표시돼요.'}
          </p>
        </div>
      );
    }

    return (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">주문일</th>
              <th scope="col">상품</th>
              <th scope="col" className={styles.alignRight}>
                금액
              </th>
              <th scope="col">배송 상태</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((order) => {
              const itemName = getItemName(order);
              return (
                <tr key={order.sellerOrderId}>
                  <td className={styles.date}>{formatDate(order.createdAt)}</td>
                  <td className={styles.itemCell}>
                    <Link to={`/orders/seller/${order.sellerOrderId}`} className={styles.itemLink}>
                      <span className={styles.thumb}>
                        <ProductThumbnail
                          src={order.thumbnailUrl}
                          alt={`${itemName} 사진`}
                          size="small"
                        />
                      </span>
                      <span className={styles.itemName}>{itemName}</span>
                    </Link>
                  </td>
                  <td className={`${styles.amount} ${styles.alignRight}`}>
                    {formatPrice(Number(order.totalAmount))}
                  </td>
                  <td>
                    <SalesStatusBadge status={order.salesStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <BackLink to="/mypage" label="마이페이지" />
      <h1 className={styles.heading}>판매 주문 목록</h1>

      <div role="tablist" aria-label="배송 상태" className={styles.tabs}>
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
              {loadState === 'done' && (
                <span className={styles.tabCount}>{countOf(item.value)}</span>
              )}
            </button>
          );
        })}
      </div>

      {renderBody()}
    </div>
  );
}

export default SalesOrdersPage;
