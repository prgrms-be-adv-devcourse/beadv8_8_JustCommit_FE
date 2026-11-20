import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getWalletTransactions } from '../../api/walletApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import { formatDate } from '../../utils/format';
import WalletView from './WalletView';

// TODO: 백엔드가 거래 종류를 여러 개 받게 되면 탭별로 서버에서 조회하고 페이지 단위로 불러오기
// 지금은 최근 거래를 한 번에 받아서 탭별로 화면에서 거름
const FETCH_SIZE = 100;

// 거래 종류(백엔드 RefType)별 배지 · 설명
// TODO: 거래 응답에 설명(상품명 · 사유 · 계좌)이 생기면 description으로 교체. 지금은 자리 문구
const REF_TYPE = {
  CHARGE: { badge: '충전', description: '토스페이먼츠 충전' },
  CHARGE_CANCEL: { badge: '충전 취소', description: '토스페이먼츠로 환불' },
  PAYMENT: { badge: '결제', description: '{대표 상품명} 외 {N}개' },
  SHIPPING_FEE: { badge: '결제', description: '{판매자} 배송비' },
  ORDER_REFUND: { badge: '환불', description: '{상품명} · {환불 사유}' },
  ORDER_ITEM_CANCEL_REFUND: { badge: '환불', description: '{상품명} · {환불 사유}' },
  SHIPPING_FEE_REFUND: { badge: '환불', description: '{판매자} 배송비 환불' },
  SETTLEMENT: { badge: '정산', description: '{상품명} 판매 정산' },
  SETTLEMENT_FEE: { badge: '정산', description: '{상품명} 정산 수수료' },
  // TODO: 시안에 없는 거래 종류 (정산 회수 · 미수금 차감) → 배지 · 문구는 시안 확인 필요
  SETTLEMENT_COLLECTION: { badge: '정산', description: '정산 회수' },
  RECEIVABLE_COLLECTION: { badge: '정산', description: '미수금 차감' },
  CASH_OUT: { badge: '인출', description: '{은행} ***{계좌 끝 4자리} 계좌로 인출' },
  CASH_OUT_CANCEL: { badge: '인출', description: '{은행} ***{계좌 끝 4자리} 이체 실패로 복원' },
};

// 탭: 같은 성격의 거래 종류를 묶음 (결제 = 상품 결제 + 배송비 등)
const TABS = [
  { key: 'ALL', label: '전체', types: null },
  { key: 'CHARGE', label: '충전', types: ['CHARGE', 'CHARGE_CANCEL'] },
  { key: 'PAYMENT', label: '결제', types: ['PAYMENT', 'SHIPPING_FEE'] },
  { key: 'REFUND', label: '환불', types: ['ORDER_REFUND', 'ORDER_ITEM_CANCEL_REFUND', 'SHIPPING_FEE_REFUND'] },
  { key: 'SETTLEMENT', label: '정산', types: ['SETTLEMENT', 'SETTLEMENT_FEE', 'SETTLEMENT_COLLECTION', 'RECEIVABLE_COLLECTION'] },
  { key: 'CASH_OUT', label: '인출', types: ['CASH_OUT', 'CASH_OUT_CANCEL'] },
];

// 거래 응답 → 화면 한 줄
function toRow(item) {
  const type = REF_TYPE[item.refType] ?? { badge: item.refType, description: '' };
  return {
    id: item.transactionId,
    date: formatDate(item.createdAt),
    badge: type.badge,
    description: item.description ?? type.description,
    amount: Number(item.amount),
    isIn: item.status === 'IN',
  };
}

function WalletPage() {
  usePageTitle('예치금');
  const { isLoggedIn, isInitializing } = useAuth();
  const { balance, chargeBalance, withdrawableBalance, refreshWallet } = useWallet();

  const [transactions, setTransactions] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | done | error
  const [tab, setTab] = useState('ALL');

  // 들어올 때마다 잔액·거래 내역을 최신으로
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    let ignore = false;
    refreshWallet().catch(() => {});
    getWalletTransactions({ size: FETCH_SIZE })
      .then((response) => {
        if (ignore) return;
        setTransactions(response.data.data.content ?? []);
        setLoadState('done');
      })
      .catch((error) => {
        if (ignore) return;
        // 지갑이 아직 없는 회원은 거래도 없음
        if (error.response?.data?.code === 'WALLET_NOT_FOUND') {
          setTransactions([]);
          setLoadState('done');
        } else {
          setLoadState('error');
        }
      });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, refreshWallet]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/wallet' }} />;

  const currentTab = TABS.find((item) => item.key === tab);
  const filtered = currentTab.types
    ? transactions.filter((item) => currentTab.types.includes(item.refType))
    : transactions;

  return (
    <WalletView
      balance={balance}
      chargeBalance={chargeBalance ?? '{충전금}'}
      withdrawableBalance={withdrawableBalance ?? '{인출 가능 금액}'}
      tabs={TABS}
      tab={tab}
      onTabChange={setTab}
      rows={filtered.map(toRow)}
      listState={loadState}
    />
  );
}

export default WalletPage;
