import { useState } from 'react';
import { findId, sendFindIdCode } from '../../../api/memberApi';
import useEmailCode from '../../../hooks/useEmailCode';
import usePageTitle from '../../../hooks/usePageTitle';
import { formatDate } from '../../../utils/format';
import { FindIdResultView, FindIdView } from './FindIdView';

const PROVIDER_LABELS = { LOCAL: '이메일', KAKAO: '카카오' };

// 응답 → 결과 화면 값 (TODO(member): 아이디 찾기 API가 생기면 필드 이름을 맞춥니다)
function toAccount(email, data) {
  return {
    email: data?.email ?? email,
    providerLabel: PROVIDER_LABELS[data?.provider] ?? '{가입 방식}',
    nickname: data?.nickname ?? '{닉네임}',
    joinedAt: data?.joinedAt ? formatDate(data.joinedAt) : '{가입일}',
  };
}

// 시안 06-2-1 · 06-2-2 아이디 찾기
function FindIdPage() {
  usePageTitle('아이디 찾기');
  const emailCode = useEmailCode({ sendCode: sendFindIdCode, verifyCode: findId });
  const [account, setAccount] = useState(null);

  if (account) return <FindIdResultView account={account} />;

  const handleSubmit = () =>
    emailCode.verify((response) => setAccount(toAccount(emailCode.email.trim(), response?.data?.data)));

  return (
    <FindIdView
      emailCode={emailCode}
      on={{
        emailChange: emailCode.setEmail,
        send: emailCode.send,
        codeChange: emailCode.setCode,
      }}
      onSubmit={handleSubmit}
    />
  );
}

export default FindIdPage;
