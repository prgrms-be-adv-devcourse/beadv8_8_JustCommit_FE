import { useEffect, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { ANONYMOUS, loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { createCharge } from '../../api/walletApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import { formatPrice } from '../../utils/format';
import { safeReturnTo } from './chargeUtils';
import styles from './Charge.module.css';

const MIN_AMOUNT = 10000; // 백엔드 ChargeCreateRequest 최소 충전 금액
const MAX_DIGITS = 8; // 입력 자릿수 제한 (최대 9,999만 원대)
const QUICK_AMOUNTS = [10000, 50000, 100000];
const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY; // .env.local

function ChargePage() {
  usePageTitle('예치금 충전');
  const { isLoggedIn, isInitializing } = useAuth();
  const { balance, refreshWallet } = useWallet();
  const [searchParams] = useSearchParams();

  const location = useLocation();
  // 주문서에서 잔액 부족으로 왔을 때: 주문서는 이동 상태(state)로 { from, shortage }를 넘김
  // 주소 뒤 값(?shortage=&returnTo=)으로 와도 받음
  const shortage = Number(searchParams.get('shortage') ?? location.state?.shortage) || 0;
  const returnTo = safeReturnTo(searchParams.get('returnTo') ?? location.state?.from);

  const [amount, setAmount] = useState(() => (shortage > 0 ? Math.max(shortage, MIN_AMOUNT) : 0));
  const [errorMessage, setErrorMessage] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  // 들어올 때 최신 잔액으로
  useEffect(() => {
    if (isLoggedIn) refreshWallet().catch(() => {});
  }, [isLoggedIn, refreshWallet]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/deposit/charge' }} />;

  const canPay = amount >= MIN_AMOUNT && !isPaying && Boolean(CLIENT_KEY);

  const handleAmountChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS);
    setAmount(Number(digits));
  };

  const addAmount = (value) => {
    setAmount((prev) => Math.min(prev + value, 10 ** MAX_DIGITS - 1));
  };

  const handlePay = async () => {
    if (!canPay) return;
    setIsPaying(true);
    setErrorMessage('');

    try {
      const response = await createCharge(amount);
      const { chargeId, pgOrderNo } = response.data.data;

      const tossPayments = await loadTossPayments(CLIENT_KEY);
      // 충전은 카드 정보를 저장하지 않는 일반 결제라 비회원 키 사용
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      // 토스는 chargeId를 모르므로 성공 주소에 붙여 두고 돌아올 때 꺼내 씀
      const successParams = new URLSearchParams({ chargeId: String(chargeId) });
      if (returnTo) successParams.set('returnTo', returnTo);

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: amount },
        orderId: pgOrderNo,
        orderName: '예치금 충전',
        successUrl: `${window.location.origin}/deposit/charge/success?${successParams}`,
        failUrl: `${window.location.origin}/deposit/charge/fail`,
      });
      // 결제가 진행되면 토스가 성공·실패 주소로 페이지를 이동시킴
    } catch (error) {
      // 결제창을 그냥 닫은 경우는 안내 없이 그대로 둠
      if (error?.code !== 'USER_CANCEL') {
        setErrorMessage(
          error.response?.data?.message ?? '결제창을 열지 못했어요. 잠시 후 다시 시도해 주세요.',
        );
      }
      setIsPaying(false);
    }
  };

  let payLabel = '결제하기';
  if (isPaying) payLabel = '결제창 여는 중...';
  else if (amount >= MIN_AMOUNT) payLabel = `${formatPrice(amount)} 결제하기`;

  return (
    <div className={styles.page}>
      <section aria-labelledby="charge-title" className={styles.card}>
        <h1 id="charge-title" className={styles.title}>
          예치금 충전
        </h1>

        {shortage > 0 && (
          <div role="status" className={styles.alert}>
            <span className="material-symbols-outlined" aria-hidden="true">
              error
            </span>
            <strong>주문에 {formatPrice(shortage)}이 부족해요</strong>
          </div>
        )}

        <div className={styles.infoRow}>
          <span>현재 예치금</span>
          <strong>{balance === null ? '-' : formatPrice(Number(balance))}</strong>
        </div>

        <div className={styles.field}>
          <label htmlFor="charge-amount" className={styles.label}>
            충전 금액
          </label>
          <span className={styles.amountBox}>
            <input
              id="charge-amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              className={styles.amountInput}
              value={amount ? amount.toLocaleString('ko-KR') : ''}
              onChange={handleAmountChange}
              disabled={isPaying}
            />
            <span className={styles.won}>원</span>
          </span>
          <div className={styles.chips}>
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                className={styles.chip}
                onClick={() => addAmount(value)}
                disabled={isPaying}
              >
                +{value / 10000}만원
              </button>
            ))}
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => setAmount(0)}
              disabled={isPaying}
            >
              지우기
            </button>
          </div>
          {amount > 0 && amount < MIN_AMOUNT && (
            <p className={styles.fieldError}>최소 {formatPrice(MIN_AMOUNT)}부터 충전할 수 있어요.</p>
          )}
        </div>

        <div className={styles.afterRow}>
          <span>충전 후 예치금</span>
          <strong>{balance === null ? '-' : formatPrice(Number(balance) + amount)}</strong>
        </div>

        <p className={styles.notice}>
          <span className="material-symbols-outlined" aria-hidden="true">
            info
          </span>
          결제하기를 누르면 토스페이먼츠 결제창이 열려요
        </p>

        {!CLIENT_KEY && <p className={styles.fieldError}>결제 설정을 불러오지 못했어요.</p>}
        {errorMessage && (
          <p className={styles.fieldError} role="alert">
            {errorMessage}
          </p>
        )}

        <button type="button" className={styles.primaryButton} disabled={!canPay} onClick={handlePay}>
          {payLabel}
        </button>
      </section>
    </div>
  );
}

export default ChargePage;
