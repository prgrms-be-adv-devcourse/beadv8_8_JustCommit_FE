import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { changeSellerIntro, getSeller } from '../../../api/memberApi';
import { ACTION_ERROR } from '../../../constants/actionError';
import useAuth from '../../../hooks/useAuth';
import usePageTitle from '../../../hooks/usePageTitle';
import AccountGuard from './AccountGuard';
import IntroView, { INTRO_MAX_LENGTH } from './IntroView';
import useMyInfo from './useMyInfo';

// 시안 06-5-2 판매자 소개: 지금 소개글은 GET sellers/{sellerId}(판매자 id = 회원 id)로 받고,
// 저장은 PATCH sellers/me/intro { intro } (빈 값이면 소개글 삭제)
function IntroPage() {
  usePageTitle('판매자 소개');
  const { user } = useAuth();
  const { myInfo, loadError } = useMyInfo();

  const [savedIntro, setSavedIntro] = useState(null); // null = 불러오는 중
  const [intro, setIntro] = useState('');
  const [introError, setIntroError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [saved, setSaved] = useState(false);

  const memberId = myInfo?.memberId;
  useEffect(() => {
    if (!memberId) return undefined;
    let ignore = false;
    getSeller(memberId)
      .then((response) => {
        if (ignore) return;
        const value = response.data.data?.intro ?? '';
        setSavedIntro(value);
        setIntro(value);
      })
      .catch((error) => {
        if (!ignore) setIntroError(error.response?.data?.message ?? '소개글을 불러오지 못했어요.');
      });
    return () => {
      ignore = true;
    };
  }, [memberId]);

  // 판매자가 아니면 닉네임 변경으로 (메뉴에서도 이 탭이 빠짐)
  if (user && user.role !== 'SELLER') return <Navigate to="/mypage/account" replace />;

  const handleChange = (value) => {
    setIntro(value);
    setSaved(false);
    setSubmitError('');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await changeSellerIntro(intro.trim());
      const value = response.data.data?.intro ?? '';
      setSavedIntro(value);
      setIntro(value);
      setSaved(true);
    } catch (error) {
      setSubmitError(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loaded = savedIntro !== null;
  const canSubmit = loaded && intro.length <= INTRO_MAX_LENGTH && intro.trim() !== (savedIntro ?? '').trim();

  return (
    <AccountGuard active="intro" myInfo={myInfo} loadError={loadError || introError}>
      <IntroView
        intro={intro}
        onIntroChange={handleChange}
        canSubmit={canSubmit}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        submitError={submitError}
        saved={saved}
      />
    </AccountGuard>
  );
}

export default IntroPage;
