import { useState } from 'react';
import { changeNickname, checkNickname } from '../../../api/memberApi';
import { ACTION_ERROR } from '../../../constants/actionError';
import useAuth from '../../../hooks/useAuth';
import usePageTitle from '../../../hooks/usePageTitle';
import AccountGuard from './AccountGuard';
import NicknameView from './NicknameView';
import useMyInfo from './useMyInfo';

const NICKNAME_REGEX = /^[가-힣A-Za-z0-9]{2,8}$/;

function errorMessage(error) {
  return error.response?.data?.message ?? ACTION_ERROR.DEFAULT;
}

function NicknamePage() {
  usePageTitle('닉네임 변경');
  const { refreshUser } = useAuth();
  const { myInfo, loadError, reload } = useMyInfo();

  const [nickname, setNickname] = useState('');
  const [checkState, setCheckState] = useState('idle'); // idle | checking | available
  const [checkError, setCheckError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleNicknameChange = (value) => {
    setNickname(value);
    setCheckState('idle');
    setCheckError('');
    setSubmitError('');
  };

  const handleCheck = async () => {
    const trimmed = nickname.trim();
    if (!NICKNAME_REGEX.test(trimmed)) {
      setCheckError('2 ~ 8자 한글 · 영문 · 숫자로 써 주세요');
      return;
    }
    if (trimmed === myInfo.nickname) {
      setCheckError('지금 쓰고 있는 닉네임이에요');
      return;
    }
    setCheckState('checking');
    setCheckError('');
    try {
      const response = await checkNickname(trimmed);
      if (response.data.data.available) {
        setCheckState('available');
      } else {
        setCheckState('idle');
        setCheckError('이미 다른 회원이 쓰고 있는 닉네임이에요');
      }
    } catch (error) {
      setCheckState('idle');
      setCheckError(errorMessage(error));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await changeNickname(nickname.trim());
      // 헤더 닉네임도 바꾸기 위해 내 정보를 다시 받음
      await refreshUser().catch(() => {});
      reload();
      setNickname('');
      setCheckState('idle');
    } catch (error) {
      setSubmitError(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AccountGuard active="nickname" myInfo={myInfo} loadError={loadError}>
      <NicknameView
        currentNickname={myInfo?.nickname ?? ''}
        nickname={nickname}
        onNicknameChange={handleNicknameChange}
        onCheck={handleCheck}
        checkState={checkState}
        checkError={checkError}
        canSubmit={checkState === 'available'}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        submitError={submitError}
      />
    </AccountGuard>
  );
}

export default NicknamePage;
