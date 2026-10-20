import { useCallback, useEffect, useMemo, useState } from 'react';
import { getWalletBalance } from '../api/walletApi';
import useAuth from '../hooks/useAuth';
import { WalletContext } from './WalletContext';

// 예치금 잔액 공유 (헤더·충전 화면 등에서 같은 값 사용)
export function WalletProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [balance, setBalance] = useState(null); // null = 조회 실패 또는 로딩 중

  // 로그인 상태가 되면 잔액을 불러옴
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    let ignore = false;
    getWalletBalance()
      .then((response) => {
        if (!ignore) setBalance(response.data.data.balance);
      })
      .catch(() => {
        if (!ignore) setBalance(null);
      });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  // 충전·결제·취소 후, 정산 알림을 받았을 때 호출해서 잔액 갱신
  const refreshWallet = useCallback(async () => {
    const response = await getWalletBalance();
    setBalance(response.data.data.balance);
  }, []);

  // 다른 탭·다른 기기에서 바뀐 잔액도 맞추려고, 탭이 다시 보이면 잔액 조회
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    const handleVisible = () => {
      if (document.visibilityState === 'visible') refreshWallet().catch(() => {});
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [isLoggedIn, refreshWallet]);

  // 로그아웃 상태면 이전 잔액을 보여 주지 않음
  const visibleBalance = isLoggedIn ? balance : null;

  const value = useMemo(
    () => ({ balance: visibleBalance, refreshWallet }),
    [visibleBalance, refreshWallet],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
