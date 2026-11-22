import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import ErrorPage from '../../components/common/ErrorPage';
import useAuth from '../../hooks/useAuth';
import useWallet from '../../hooks/useWallet';
import usePageTitle from '../../hooks/usePageTitle';
import { formatPrice } from '../../utils/format';
import { fetchSettlements, signedPriceText, toSettlementRow } from './settlementRows';
import SettlementView from './SettlementView';

function isThisMonth(value) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

// 금액이 문자열(BigDecimal)로 올 수 있어 숫자로 더함
const sumPayout = (rows) => rows.reduce((total, row) => total + (Number(row.payoutAmount) || 0), 0);

function SettlementPage() {
  usePageTitle('정산');
  const { user, isLoggedIn, isInitializing } = useAuth();
  const { balance } = useWallet();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [rows, setRows] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error

  useEffect(() => {
    if (!canSell) return undefined;

    let ignore = false;
    fetchSettlements()
      .then((list) => {
        if (ignore) return;
        setRows(list.map(toSettlementRow));
        setLoadState('done');
      })
      .catch(() => {
        if (!ignore) setLoadState('error');
      });

    return () => {
      ignore = true;
    };
  }, [canSell]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/settlements' }} />;
  if (!canSell) return <Navigate to="/seller/register" replace />;
  if (loadState === 'loading') return <main className="flex-1" />;
  if (loadState === 'error') return <ErrorPage type="SERVER_ERROR" />;

  // TODO: 백엔드에 정산 요약 API가 생기면 교체 (지금은 내역으로 계산). 세 번째 칸은 예치금 잔액
  const pending = rows.filter((row) => row.statusKey !== 'COMPLETED');
  const monthPaid = rows.filter((row) => row.statusKey === 'COMPLETED' && isThisMonth(row.date));
  const summary = {
    pendingText: signedPriceText(sumPayout(pending)),
    monthPaidText: signedPriceText(sumPayout(monthPaid)),
    monthSinceText: `${new Date().getMonth() + 1}월 1일부터`,
    balanceText: balance === null || balance === undefined ? '-' : formatPrice(Number(balance)),
  };

  return <SettlementView summary={summary} rows={rows} />;
}

export default SettlementPage;
