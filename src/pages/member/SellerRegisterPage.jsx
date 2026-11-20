import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import usePageTitle from '../../hooks/usePageTitle';
import useSellerConsentPolicy from '../../hooks/useSellerConsentPolicy';
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
  const consentPolicy = useSellerConsentPolicy(isLoggedIn);

  const [intro, setIntro] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentKey, setConsentKey] = useState(0); // 취소 때 동의 상자 펼침을 처음으로

  // 로그인 상태 복구가 끝나기 전에는 판단하지 않음
  if (isInitializing) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user.role === 'SELLER' && !isSubmitting) return <Navigate to="/" replace />;

  const handleSubmit = async () => {
    if (!agreed) return;
    // 동의 문구를 못 받아 버전이 없으면 보내도 400이라 막고 다시 조회
    if (!consentPolicy.version) {
      setErrorMessage('동의 내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      consentPolicy.reload();
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await registerSeller(intro.trim(), consentPolicy.version);
      await refreshUser();
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ?? '판매자 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
      // 409 REVIEW_CONSENT_VERSION_MISMATCH: 동의 문구가 바뀜 → 새 문구를 펼쳐 다시 동의받음 (BE 메시지가 안내 문구)
      if (error.response?.data?.code === 'REVIEW_CONSENT_VERSION_MISMATCH') {
        consentPolicy.reload();
        setAgreed(false);
        setConsentKey((key) => key + 1);
      }
      setIsSubmitting(false);
    }
  };

  // 취소: 체크 · 소개글 · 동의 상자 펼침을 처음 상태로 되돌림 (화면은 그대로)
  const handleCancel = () => {
    setIntro('');
    setAgreed(false);
    setErrorMessage('');
    setConsentKey((key) => key + 1);
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
      consentPolicy={consentPolicy}
      consentKey={consentKey}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
    />
  );
}

export default SellerRegisterPage;
