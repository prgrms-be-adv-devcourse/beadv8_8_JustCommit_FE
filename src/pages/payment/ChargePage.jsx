import { useEffect, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { ANONYMOUS, loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { getOrder } from '../../api/orderApi';
import { createCharge } from '../../api/walletApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import { formatPrice } from '../../utils/format';
import { parseAmount } from './chargeUtils';
import ChargeView from './ChargeView';

const MIN_AMOUNT = 10000; // 백엔드 ChargeCreateRequest 최소 충전 금액
const CHARGE_UNIT = 10000; // 충전 단위 (docs/services/payment.md 「충전」: 10,000원 단위)
const MAX_DIGITS = 8; // 입력 자릿수 제한 (최대 9,999만 원대)
const PAYMENT_WINDOW_MS = 10 * 60 * 1000; // 주문 후 결제 대기 10분 (응답에 expiresAt이 없을 때만 사용)
const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY; // .env.local (코드에 키를 넣지 않음)

// 부족 금액을 충전 단위로 올림 (45,150원 부족 → 50,000원)
function roundUpToUnit(shortage) {
  return Math.max(Math.ceil(shortage / CHARGE_UNIT) * CHARGE_UNIT, MIN_AMOUNT);
}

// 남은 초 → "08:15"
function toMinuteSecond(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// 시안 07-2-1 충전 · 07-2-2 주문서에서 넘어온 충전
// 주문서에서 잔액 부족으로 결제 대기(PAYMENT_PENDING)가 되면 ?orderId= 로 들어옴
// → 충전이 끝나면 성공 화면에서 그 주문을 자동 결제 (POST orders/{id}/pay)
function ChargePage() {
  usePageTitle('예치금 충전');
  const { isLoggedIn, isInitializing } = useAuth();
  const { balance, refreshWallet } = useWallet();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const orderId = searchParams.get('orderId') ?? location.state?.orderId ?? null;
  // 이전 주문서 연결: 이동 상태(state)로 { shortage }를 넘기면 금액만 미리 채움
  const shortage = Number(searchParams.get('shortage') ?? location.state?.shortage) || 0;

  const [amount, setAmount] = useState(() => (shortage > 0 ? roundUpToUnit(shortage) : 0));
  const [order, setOrder] = useState(null); // { totalAmount, expiresAtMs }
  const [now, setNow] = useState(() => Date.now());
  const [errorMessage, setErrorMessage] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  // 들어올 때 최신 잔액으로
  useEffect(() => {
    if (isLoggedIn) refreshWallet().catch(() => {});
  }, [isLoggedIn, refreshWallet]);

  // 주문서에서 왔으면 주문 금액 · 결제 기한을 불러오고, 부족 금액으로 충전 금액을 채움
  useEffect(() => {
    if (!isLoggedIn || !orderId) return undefined;
    let ignore = false;

    Promise.all([getOrder(orderId), refreshWallet()])
      .then(([response, wallet]) => {
        if (ignore) return;
        // 주문 API는 ApiResponse로 감싸지 않고 DTO를 그대로 반환
        const data = response.data.data ?? response.data;
        const totalAmount = Number(data.totalAmount);
        const expiresAtMs = data.expiresAt
          ? new Date(data.expiresAt).getTime()
          : new Date(data.createdAt).getTime() + PAYMENT_WINDOW_MS;
        setOrder({ totalAmount, expiresAtMs, status: data.status });
        const lack = totalAmount - Number(wallet.balance ?? 0);
        if (lack > 0) setAmount(roundUpToUnit(lack));
      })
      .catch((error) => {
        if (!ignore) setErrorMessage(error.response?.data?.message ?? '주문 정보를 불러오지 못했어요.');
      });

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, orderId, refreshWallet]);

  // 남은 시간 1초마다 갱신
  useEffect(() => {
    if (!order) return undefined;
    const timerId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timerId);
  }, [order]);

  if (isInitializing) return null;
  if (!isLoggedIn) {
    const from = `/deposit/charge${location.search}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }
  // 이미 결제됐거나 취소된 주문이면 주문 상세로
  if (order && order.status && order.status !== 'PAYMENT_PENDING') {
    return <Navigate to={`/orders/${orderId}`} replace />;
  }

  const remainingMs = order ? order.expiresAtMs - now : 0;
  const isExpired = Boolean(order) && remainingMs <= 0;

  let amountError = '';
  if (amount > 0 && amount < MIN_AMOUNT) amountError = `최소 ${formatPrice(MIN_AMOUNT)}부터 충전할 수 있어요`;
  else if (amount % CHARGE_UNIT !== 0) amountError = `${formatPrice(CHARGE_UNIT)} 단위로 입력해 주세요`;

  const isValidAmount = amount >= MIN_AMOUNT && !amountError;
  const canPay = isValidAmount && !isPaying && Boolean(CLIENT_KEY) && !(orderId && (!order || isExpired));

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
      // 토스가 orderId(=pgOrderNo)를 따로 붙이므로 우리 주문 번호는 marketOrderId로 넘김
      const successParams = new URLSearchParams({ chargeId: String(chargeId) });
      const failParams = new URLSearchParams();
      if (orderId) {
        successParams.set('marketOrderId', orderId);
        failParams.set('marketOrderId', orderId);
      }

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: amount },
        orderId: pgOrderNo,
        orderName: '예치금 충전',
        successUrl: `${window.location.origin}/deposit/charge/success?${successParams}`,
        failUrl: `${window.location.origin}/deposit/charge/fail?${failParams}`,
      });
      // 결제가 진행되면 토스가 성공·실패 주소로 페이지를 이동시킴
    } catch (error) {
      // 결제창을 그냥 닫은 경우는 안내 없이 그대로 둠
      if (error?.code !== 'USER_CANCEL') {
        setErrorMessage(error.response?.data?.message ?? '결제창을 열지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
      setIsPaying(false);
    }
  };

  let payLabel = orderId ? '충전하고 결제하기' : '결제하기';
  if (isPaying) payLabel = '결제창 여는 중...';
  else if (isValidAmount) payLabel = `${formatPrice(amount)} ${payLabel}`;

  let shownError = errorMessage;
  if (!CLIENT_KEY) shownError = '결제 설정을 불러오지 못했어요.';
  else if (isExpired) shownError = '결제 기한이 지나 주문이 취소됐어요. 장바구니에서 다시 주문해 주세요.';

  return (
    <ChargeView
      balance={balance === null ? null : Number(balance)}
      amount={amount}
      onAmountChange={(text) => setAmount(parseAmount(text, MAX_DIGITS))}
      onAdd={(value) => setAmount((prev) => Math.min(prev + value, 10 ** MAX_DIGITS - 1))}
      onClear={() => setAmount(0)}
      disabled={isPaying}
      canPay={canPay}
      onPay={handlePay}
      payLabel={payLabel}
      amountError={amountError}
      errorMessage={shownError}
      order={order && { totalAmount: order.totalAmount, remaining: toMinuteSecond(remainingMs) }}
    />
  );
}

export default ChargePage;
