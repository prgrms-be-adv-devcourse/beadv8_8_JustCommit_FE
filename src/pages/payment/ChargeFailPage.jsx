import { useSearchParams } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import { ChargeFailView } from './ChargeResultView';

// 토스가 결제 실패·취소 시 이동시키는 화면 (?code=...&message=...&orderId=...&marketOrderId=...)
function ChargeFailPage() {
  usePageTitle('충전 실패');
  const [searchParams] = useSearchParams();
  const marketOrderId = searchParams.get('marketOrderId');
  const retryTo = marketOrderId ? `/deposit/charge?orderId=${encodeURIComponent(marketOrderId)}` : undefined;
  return <ChargeFailView retryTo={retryTo} />;
}

export default ChargeFailPage;
