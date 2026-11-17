import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import { registerSeller } from '../../api/memberApi';
import { formatBankAccount } from '../../constants/banks';
import useMyInfo from './account/useMyInfo';
import SellerRegisterView from './SellerRegisterView';

// 정산 계좌는 내 정보(GET /api/v1/users/me)의 account. 불러오기 전 · 실패 · 미등록이면 자리 문구
const ACCOUNT_PLACEHOLDER = '{은행} ***{계좌 끝 4자리} · 예금주 {예금주}';

function SellerRegisterPage() {
  usePageTitle('판매자 등록');
  const { user, isLoggedIn, isInitializing, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { myInfo } = useMyInfo();

  const [intro, setIntro] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로그인 상태 복구가 끝나기 전에는 판단하지 않음
  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user.role === 'SELLER' && !isSubmitting) return <Navigate to="/" replace />;

  const handleSubmit = async () => {
    if (!agreed) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // TODO: 사진 외부 전송 · 학습 이용 동의 값을 받는 필드가 생기면 함께 보냄
      await registerSeller(intro.trim());
      await refreshUser();
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ?? '판매자 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
      setIsSubmitting(false);
    }
  };

  return (
    <SellerRegisterView
      account={myInfo?.account ? formatBankAccount(myInfo.account) : ACCOUNT_PLACEHOLDER}
      intro={intro}
      onIntroChange={setIntro}
      agreed={agreed}
      onAgreedChange={setAgreed}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onCancel={() => navigate(-1)}
      onSubmit={handleSubmit}
    />
  );
}

export default SellerRegisterPage;
