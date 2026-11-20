import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import ChargeHistoryView from './ChargeHistoryView';

// TODO: 충전 내역 API(walletApi.getCharges)가 생기면 이 자리 문구 대신 응답으로 그림
// 응답 → 화면: approvedAt은 formatDateTime으로 "2026.10.15 14:20", 금액은 숫자 그대로
const PLACEHOLDER_CHARGES = [{ chargeId: 'placeholder', approvedAt: '{충전일시}', amount: '{충전 금액}', status: 'APPROVED' }];

// 시안 07-3-1 충전 내역 (충전 취소는 하지 않기로 함)
function ChargeHistoryPage() {
  usePageTitle('충전 내역');
  const { isLoggedIn, isInitializing } = useAuth();
  const { refreshWallet } = useWallet();

  useEffect(() => {
    if (isLoggedIn) refreshWallet().catch(() => {});
  }, [isLoggedIn, refreshWallet]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/wallet/charges' }} />;

  return <ChargeHistoryView charges={PLACEHOLDER_CHARGES} />;
}

export default ChargeHistoryPage;
