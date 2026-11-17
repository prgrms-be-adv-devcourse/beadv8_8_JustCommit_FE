import { Link } from 'react-router-dom';
import { AuthCardPage, AuthHeading, DoneMark, SubmitButton } from '../../../components/member/AuthField';
import EmailCodeFields from '../../../components/member/EmailCodeFields';

// 시안 06-2-1 아이디 찾기 (이메일 인증)
export function FindIdView({ emailCode, on, onSubmit }) {
  return (
    <AuthCardPage backTo="/login">
      <AuthHeading
        title="아이디 찾기"
        description="아이디는 가입할 때 쓴 이메일이에요. 이메일을 인증하면 그 이메일로 가입한 계정을 확인할 수 있어요."
      />
      <EmailCodeFields variant="plain" emailCode={emailCode} on={on} />
      <SubmitButton type="button" onClick={onSubmit}>
        확인
      </SubmitButton>
    </AuthCardPage>
  );
}

// 시안 06-2-2 아이디 찾기 결과
// account: { email, provider, nickname, joinedAt } — 아직 API가 없어 값이 없으면 자리 문구
function Row({ label, value, numeric = false }) {
  return (
    <div className="px-4 py-3 flex justify-between">
      <dt className="text-[#6b7280]">{label}</dt>
      <dd className={numeric ? 'font-semibold text-[#111827] tabular-nums' : 'font-semibold text-[#111827]'}>{value}</dd>
    </div>
  );
}

export function FindIdResultView({ account }) {
  return (
    <AuthCardPage backTo="/login">
      <div className="flex flex-col items-center text-center gap-3">
        <DoneMark />
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">가입한 계정이 있어요</h1>
      </div>
      <dl className="border border-[#e5e7eb] divide-y divide-[#e5e7eb] text-sm">
        <Row label="아이디 (이메일)" value={account.email} />
        <Row label="가입 방식" value={account.providerLabel} />
        <Row label="닉네임" value={account.nickname} />
        <Row label="가입일" value={account.joinedAt} numeric />
      </dl>
      <p className="text-[13px] text-[#6b7280] text-center">카카오로 가입했다면 가입 방식에 「카카오」로 보여요</p>
      <div className="flex gap-2">
        <Link
          to="/reset-password"
          className="flex-1 h-12 flex items-center justify-center bg-white border border-[#0f4c3a] text-[#0f4c3a] text-[15px] font-bold"
        >
          비밀번호 재설정
        </Link>
        <Link to="/login" className="flex-1 h-12 flex items-center justify-center bg-[#0f4c3a] text-white text-[15px] font-bold">
          로그인
        </Link>
      </div>
    </AuthCardPage>
  );
}
