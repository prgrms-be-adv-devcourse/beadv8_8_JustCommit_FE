import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import WithdrawHistoryView from './WithdrawHistoryView';

// TODO: 인출 내역 API(walletApi.getCashOuts)가 생기면 이 자리 문구 대신 응답으로 그림
// 응답 → 화면: requestedAt은 formatDateTime, account는 `${bankName} ***${accountLast4}`
const PLACEHOLDER_CASH_OUTS = [
  {
    cashOutId: 'placeholder',
    requestedAt: '{신청일시}',
    amount: '{인출 금액}',
    account: '{은행} ***{계좌 끝 4자리}',
    status: 'REQUESTED',
  },
];

// 시안 07-4-3 인출 내역 · 07-4-4 빈 상태
function WithdrawHistoryPage() {
  usePageTitle('인출 내역');
  const { isLoggedIn, isInitializing } = useAuth();

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/wallet/withdrawals' }} />;

  return <WithdrawHistoryView cashOuts={PLACEHOLDER_CASH_OUTS} />;
}

export default WithdrawHistoryPage;
