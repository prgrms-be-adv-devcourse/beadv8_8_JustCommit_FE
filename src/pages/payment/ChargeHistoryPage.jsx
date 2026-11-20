import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getWalletTransactions } from '../../api/walletApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import { formatDateTime } from '../../utils/format';
import ChargeHistoryView from './ChargeHistoryView';

// 불러오기 전 · 실패 때 보여 줄 자리 문구
const PLACEHOLDER_CHARGES = [{ chargeId: 'placeholder', approvedAt: '{충전일시}', amount: '{충전 금액}', status: 'APPROVED' }];

// TODO: 페이지 이동 화면이 없어 한 번에 넉넉히 받음 (BE 기본 20건)
const PAGE_SIZE = 100;

// 충전 내역 전용 API는 없어 거래 내역(refType=CHARGE)으로 그림
// 충전 거래는 승인된 충전만 생김 (BE WalletTransaction.chargeIn: refId = chargeId, refOccurredTime = 승인 시각)
function toRow(item) {
  return {
    chargeId: item.refId ?? item.transactionId,
    approvedAt: formatDateTime(item.refOccurredTime ?? item.createdAt),
    amount: Number(item.amount),
    status: 'APPROVED',
  };
}

// 시안 07-3-1 충전 내역 (충전 취소는 하지 않기로 함)
function ChargeHistoryPage() {
  usePageTitle('충전 내역');
  const { isLoggedIn, isInitializing } = useAuth();
  const { refreshWallet } = useWallet();
  const [charges, setCharges] = useState(null); // null: 불러오는 중 · 실패

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let ignore = false;
    refreshWallet().catch(() => {});
    getWalletTransactions({ refType: 'CHARGE', size: PAGE_SIZE })
      .then((response) => {
        if (!ignore) setCharges((response.data.data?.content ?? []).map(toRow));
      })
      .catch((error) => {
        // 지갑이 아직 없는 회원은 충전도 없음
        if (!ignore && error.response?.data?.code === 'WALLET_NOT_FOUND') setCharges([]);
      });
    return () => {
      ignore = true;
    };
  }, [isLoggedIn, refreshWallet]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/wallet/charges' }} />;

  return <ChargeHistoryView charges={charges ?? PLACEHOLDER_CHARGES} />;
}

export default ChargeHistoryPage;
