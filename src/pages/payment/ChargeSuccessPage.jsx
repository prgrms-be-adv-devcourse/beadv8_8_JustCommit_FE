import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { confirmCharge } from '../../api/walletApi';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import useWallet from '../../hooks/useWallet';
import { formatPrice } from '../../utils/format';
import { ChargeFailCard } from './ChargeFailPage';
import { safeReturnTo } from './chargeUtils';
import styles from './Charge.module.css';

function ChargeSuccessPage() {
  usePageTitle('충전 완료');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, isInitializing } = useAuth();
  const { refreshWallet } = useWallet();

  // 승인이 끝나면 결과만 화면 상태로 남김 → 새로고침해도 다시 승인하지 않음
  const savedResult = location.state?.chargeResult ?? null;

  // 토스가 성공 주소에 붙여 주는 값 + 결제창을 열 때 붙여 둔 chargeId
  const chargeId = searchParams.get('chargeId');
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const hasParams = Boolean(chargeId && paymentKey && orderId && amount);

  const [errorMessage, setErrorMessage] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    // 로그인 복구가 끝난 뒤 한 번만 승인 (개발 모드에서 effect가 두 번 실행돼도 한 번만 요청)
    if (!isLoggedIn || savedResult || !hasParams || startedRef.current) return;
    startedRef.current = true;

    confirmCharge(chargeId, { paymentKey, orderId, amount: Number(amount) })
      .then((response) => {
        const { amount: charged, balanceAfter } = response.data.data;
        refreshWallet().catch(() => {});
        navigate('/deposit/charge/success', {
          replace: true,
          state: { chargeResult: { amount: charged, balanceAfter, returnTo } },
        });
      })
      .catch((error) => {
        setErrorMessage(error.response?.data?.message ?? '충전을 마무리하지 못했어요.');
      });
  }, [isLoggedIn, savedResult, hasParams, chargeId, paymentKey, orderId, amount, returnTo, navigate, refreshWallet]);

  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (savedResult) {
    return (
      <div className={styles.page}>
        <section aria-labelledby="cs-title" className={`${styles.card} ${styles.resultCard}`}>
          <span className={`material-symbols-outlined ${styles.resultIcon}`} aria-hidden="true">
            check
          </span>
          <h1 id="cs-title" className={styles.resultTitle}>
            충전이 완료됐어요
          </h1>
          <dl className={styles.summary}>
            <div className={styles.summaryRow}>
              <dt>충전 금액</dt>
              <dd>{formatPrice(Number(savedResult.amount))}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt>현재 예치금</dt>
              <dd className={styles.summaryStrong}>{formatPrice(Number(savedResult.balanceAfter))}</dd>
            </div>
          </dl>
          {savedResult.returnTo ? (
            <div className={styles.resultActions}>
              <Link to="/wallet" className={styles.outlineButton}>
                예치금 보기
              </Link>
              <Link to={savedResult.returnTo} className={styles.primaryButton}>
                주문서로 돌아가기
              </Link>
            </div>
          ) : (
            <Link to="/wallet" className={styles.primaryButton}>
              예치금 보기
            </Link>
          )}
        </section>
      </div>
    );
  }

  if (!hasParams || errorMessage) {
    return <ChargeFailCard detail={errorMessage || '결제 정보를 찾을 수 없어요.'} />;
  }

  return (
    <div className={styles.page}>
      <section className={`${styles.card} ${styles.resultCard}`}>
        <p className={styles.resultDesc}>충전을 마무리하는 중이에요...</p>
      </section>
    </div>
  );
}

export default ChargeSuccessPage;
