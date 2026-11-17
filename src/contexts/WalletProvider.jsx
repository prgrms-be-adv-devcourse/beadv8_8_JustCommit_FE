import { useCallback, useEffect, useMemo, useState } from 'react';
import { getWalletBalance } from '../api/walletApi';
import useAuth from '../hooks/useAuth';
import { WalletContext } from './WalletContext';

// 예치금 잔액 공유 (헤더·충전 화면 등에서 같은 값 사용)
// 예치금 = 충전금(chargeBalance) + 인출 가능 금액(withdrawableBalance, 판매 정산금)
// TODO: 백엔드 GET /wallet 응답에 chargeBalance · withdrawableBalance가 생기면 그대로 쓰임 (지금은 balance만 옴 → null)
function toWallet(data) {
  return {
    balance: data.balance,
    chargeBalance: data.chargeBalance ?? null,
    withdrawableBalance: data.withdrawableBalance ?? null,
  };
}

const EMPTY_WALLET = { balance: null, chargeBalance: null, withdrawableBalance: null };

export function WalletProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [wallet, setWallet] = useState(EMPTY_WALLET); // balance null = 조회 실패 또는 로딩 중

  // 로그인 상태가 되면 잔액을 불러옴
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    let ignore = false;
    getWalletBalance()
      .then((response) => {
        if (!ignore) setWallet(toWallet(response.data.data));
      })
      .catch(() => {
        if (!ignore) setWallet(EMPTY_WALLET);
      });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  // 충전·결제·취소 후, 정산 알림을 받았을 때 호출해서 잔액 갱신 (갱신한 값을 돌려줌)
  const refreshWallet = useCallback(async () => {
    const response = await getWalletBalance();
    const next = toWallet(response.data.data);
    setWallet(next);
    return next;
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
  const visible = isLoggedIn ? wallet : EMPTY_WALLET;

  const value = useMemo(() => ({ ...visible, refreshWallet }), [visible, refreshWallet]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
