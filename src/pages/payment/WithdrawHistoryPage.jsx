import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCashOuts } from '../../api/walletApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDateTime } from '../../utils/format';
import WithdrawHistoryView from './WithdrawHistoryView';

// 불러오기 전 · 실패 때 보여 줄 자리 문구
const PLACEHOLDER_CASH_OUTS = [
  {
    cashOutId: 'placeholder',
    requestedAt: '{신청일시}',
    amount: '{인출 금액}',
    account: '{은행} ***{계좌 끝 4자리}',
    status: 'REQUESTED',
  },
];

// TODO: 페이지 이동 화면이 없어 한 번에 넉넉히 받음 (BE 기본 20건)
const PAGE_SIZE = 100;

// BE 인출 상태 → 화면 상태 (BE는 PENDING · COMPLETED만, 이체 실패는 #389에서 추가 예정)
const STATUS_MAP = { PENDING: 'REQUESTED', COMPLETED: 'COMPLETED' };

// 인출 응답 → 화면 한 줄
// TODO: 은행 이름(bankCode)이 응답에 없어 은행 자리는 자리 문구로 둠
function toRow(item) {
  return {
    cashOutId: item.cashOutId,
    requestedAt: formatDateTime(item.requestedAt),
    amount: Number(item.amount),
    account: `{은행} ***${item.accountLast4}`,
    status: STATUS_MAP[item.status] ?? item.status,
  };
}

// 시안 07-4-3 인출 내역 · 07-4-4 빈 상태
function WithdrawHistoryPage() {
  usePageTitle('인출 내역');
  const { isLoggedIn, isInitializing } = useAuth();
  const [cashOuts, setCashOuts] = useState(null); // null: 불러오는 중 · 실패

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    getCashOuts({ size: PAGE_SIZE })
      .then((response) => {
        if (!ignore) setCashOuts((response.data.data?.content ?? []).map(toRow));
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/wallet/withdrawals' }} />;

  return <WithdrawHistoryView cashOuts={cashOuts ?? PLACEHOLDER_CASH_OUTS} />;
}

export default WithdrawHistoryPage;
