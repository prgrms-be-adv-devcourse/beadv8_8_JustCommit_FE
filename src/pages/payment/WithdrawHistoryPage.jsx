import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCashOuts } from '../../api/walletApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { formatDateTime } from '../../utils/format';
import { bankNameForLast4 } from '../../constants/banks';
import useMyInfo from '../member/account/useMyInfo';
import WithdrawHistoryView from './WithdrawHistoryView';
import { EMPTY } from '../../constants/emptyText';

// 불러오기 전 · 실패 때 보여 줄 빈 줄 (값은 「-」, 상태 배지는 숨김)
const PLACEHOLDER_CASH_OUTS = [
  {
    cashOutId: 'placeholder',
    requestedAt: EMPTY,
    amount: EMPTY,
    account: EMPTY,
    status: null,
  },
];

// TODO: 페이지 이동 화면이 없어 한 번에 넉넉히 받음 (BE 기본 20건)
const PAGE_SIZE = 100;

// BE 인출 상태 → 화면 상태 (BE는 PENDING · COMPLETED만, 이체 실패는 #389에서 추가 예정)
const STATUS_MAP = { PENDING: 'REQUESTED', COMPLETED: 'COMPLETED' };

// 인출 응답 → 화면 한 줄 (은행은 인출 응답에 없어 내 등록 계좌로 찾음, 못 찾으면 계좌 끝 4자리만)
function toRow(item, myAccount) {
  return {
    cashOutId: item.cashOutId,
    requestedAt: formatDateTime(item.requestedAt),
    amount: Number(item.amount),
    account: item.accountLast4
      ? [bankNameForLast4(item.accountLast4, myAccount), `***${item.accountLast4}`].filter(Boolean).join(' ')
      : EMPTY,
    status: STATUS_MAP[item.status] ?? item.status,
  };
}

// 시안 07-4-3 인출 내역 · 07-4-4 빈 상태
function WithdrawHistoryPage() {
  usePageTitle('인출 내역');
  const { isLoggedIn, isInitializing } = useAuth();
  const { myInfo } = useMyInfo();
  const [cashOuts, setCashOuts] = useState(null); // null: 불러오는 중 · 실패

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    getCashOuts({ size: PAGE_SIZE })
      .then((response) => {
        if (!ignore) setCashOuts(response.data.data?.content ?? []);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/wallet/withdrawals' }} />;

  const rows = cashOuts ? cashOuts.map((item) => toRow(item, myInfo?.account)) : PLACEHOLDER_CASH_OUTS;
  return <WithdrawHistoryView cashOuts={rows} />;
}

export default WithdrawHistoryPage;
