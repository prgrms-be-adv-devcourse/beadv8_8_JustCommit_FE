import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import ErrorPage from '../../components/common/ErrorPage';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatPrice } from '../../utils/format';
import { fetchSettlements, formatSettlementDate, signedPriceText, toSettlementRow } from './settlementRows';
import SettlementReportView from './SettlementReportView';

const CHART_MONTHS = 6;
const BAR_MAX_PX = 181; // 시안 막대 최대 높이

const pad = (value) => String(value).padStart(2, '0');
const toKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const monthKey = (year, month) => `${year}-${pad(month + 1)}`; // month: 0~11

// 기간 → { from, to } ("2026-10-01" 형식, 양 끝 포함)
function getRange(period, custom) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (period === 'LAST_MONTH') return { from: toKey(new Date(y, m - 1, 1)), to: toKey(new Date(y, m, 0)) };
  if (period === 'LAST_3_MONTHS') return { from: toKey(new Date(y, m - 2, 1)), to: toKey(new Date(y, m + 1, 0)) };
  if (period === 'CUSTOM') return custom;
  return { from: toKey(new Date(y, m, 1)), to: toKey(new Date(y, m + 1, 0)) };
}

function SettlementReportPage() {
  usePageTitle('정산 리포트');
  const { user, isLoggedIn, isInitializing } = useAuth();
  const canSell = user?.role === 'SELLER' || user?.role === 'ADMIN';

  const [rows, setRows] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error
  const [period, setPeriod] = useState('THIS_MONTH');
  const [custom, setCustom] = useState(() => getRange('THIS_MONTH'));

  useEffect(() => {
    if (!canSell) return undefined;

    let ignore = false;
    // TODO: 백엔드에 기간별 리포트(수수료 · 배송비 · 정산금) API가 생기면 교체. 지금은 전체 내역으로 계산
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
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/settlements/report' }} />;
  if (!canSell) return <Navigate to="/seller/register" replace />;
  if (loadState === 'loading') return <main className="flex-1" />;
  if (loadState === 'error') return <ErrorPage type="SERVER_ERROR" />;

  const range = getRange(period, custom);
  // 리포트는 지급 완료일 기준. 지급 전 정산(date null)은 기간 합계에서 뺌
  // TODO: BE 응답에 정산 생성일(createdAt)이 생기면 지급 전 정산도 기간에 넣을 수 있음
  const inRange = rows.filter((row) => {
    if (!row.date) return false;
    const day = row.date.slice(0, 10);
    return day >= range.from && day <= range.to;
  });

  // 값이 없는 칸은 0으로 더함 (NaN 방지)
  const sum = (list, field) => list.reduce((total, row) => total + (Number(row[field]) || 0), 0);
  const fee = sum(inRange, 'fee');
  const burden = sum(inRange, 'sellerBurden');
  const summary = {
    saleText: formatPrice(sum(inRange, 'saleAmount')),
    saleCountText: `판매 ${inRange.length}건`,
    feeText: fee > 0 ? `−${formatPrice(fee)}` : formatPrice(0),
    burdenNote: burden > 0 ? `판매자 부담금 −${formatPrice(burden)} 별도` : null,
    payoutText: signedPriceText(sum(inRange, 'payoutAmount')),
  };

  // 최근 6개월 막대: 기간 끝 달까지, 선택한 기간에 걸친 달은 초록
  const end = new Date(`${range.to}T00:00:00`);
  const fromMonth = range.from.slice(0, 7);
  const toMonth = range.to.slice(0, 7);
  const monthList = Array.from({ length: CHART_MONTHS }, (_, i) => {
    const date = new Date(end.getFullYear(), end.getMonth() - (CHART_MONTHS - 1 - i), 1);
    const key = monthKey(date.getFullYear(), date.getMonth());
    const amount = rows.filter((row) => row.date?.slice(0, 7) === key).reduce((t, row) => t + (Number(row.payoutAmount) || 0), 0);
    return { key, label: `${date.getMonth() + 1}월`, amount, selected: key >= fromMonth && key <= toMonth };
  });
  const max = Math.max(...monthList.map((month) => month.amount), 0);
  const months = monthList.map((month) => ({
    ...month,
    height: max > 0 ? Math.round((month.amount / max) * BAR_MAX_PX) : 0,
    valueText: `${(month.amount / 10000).toFixed(1)}만`,
  }));

  return (
    <SettlementReportView
      period={period}
      onPeriodChange={setPeriod}
      rangeText={`${formatSettlementDate(range.from)} ~ ${formatSettlementDate(range.to)}`}
      custom={
        period === 'CUSTOM'
          ? {
              ...custom,
              onFromChange: (from) => setCustom((prev) => ({ ...prev, from })),
              onToChange: (to) => setCustom((prev) => ({ ...prev, to })),
            }
          : null
      }
      summary={summary}
      months={months}
      rows={inRange}
    />
  );
}

export default SettlementReportPage;
