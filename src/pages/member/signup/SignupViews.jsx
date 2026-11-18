import { Link } from 'react-router-dom';
import { ActionErrorLine } from '../../../components/common/ActionError';
import { AuthHeading, DoneMark, FieldHint, SubmitButton } from '../../../components/member/AuthField';
import authInputClass from '../../../components/member/authInputClass';
import EmailCodeFields from '../../../components/member/EmailCodeFields';
import MemberInfoFields from '../../../components/member/MemberInfoFields';
import SellerConsentBox from '../../../components/member/SellerConsentBox';
import TermsAgreement from '../../../components/member/TermsAgreement';

// 시안 06-3 회원가입: 1 이메일 인증 → 2 정보 입력 → 3 판매자 등록 (선택) → 가입 완료, 카카오 가입

const CARD_WIDTH = { 440: 'max-w-[440px]', 560: 'max-w-[560px]', 640: 'max-w-[640px]' };

function SignupCard({ width = 440, children }) {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-5 py-14 flex justify-center items-start">
      <section className={`w-full ${CARD_WIDTH[width]} bg-white border border-[#e5e7eb] p-9 space-y-7`}>{children}</section>
    </main>
  );
}

function StepCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const STEPS = ['이메일 인증', '정보 입력', '판매자 등록 (선택)'];

// current: 지금 단계 (0 ~ 2), 3이면 모두 끝남
function SignupStepper({ current }) {
  return (
    <ol className="flex">
      {STEPS.map((label, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        let circle;
        if (isDone) {
          circle = (
            <span className="w-7 h-7 flex items-center justify-center bg-[#0f4c3a] text-white">
              <StepCheck />
            </span>
          );
        } else if (isCurrent) {
          circle = (
            <span className="w-7 h-7 flex items-center justify-center bg-[#0f4c3a] text-white text-[13px] font-bold ring-2 ring-offset-2 ring-[#0f4c3a]">
              {index + 1}
            </span>
          );
        } else {
          circle = (
            <span className="w-7 h-7 flex items-center justify-center bg-white border-2 border-[#d1d5db] text-[13px] font-bold text-[#9ca3af]">
              {index + 1}
            </span>
          );
        }
        let labelClass = 'text-xs text-[#9ca3af] font-medium';
        if (isDone) labelClass = 'text-xs text-[#4b5563] font-medium';
        if (isCurrent) labelClass = 'text-xs text-[#0f4c3a] font-bold';

        return (
          <li key={label} className="relative flex-1 flex flex-col items-center gap-2">
            {index > 0 && (
              <span
                className={`absolute top-[13px] right-1/2 w-full h-0.5 ${index <= current ? 'bg-[#0f4c3a]' : 'bg-[#e5e7eb]'}`}
                style={{ marginRight: '14px' }}
              />
            )}
            <span className="relative z-10">{circle}</span>
            <span className={labelClass}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function LoginPrompt() {
  return (
    <p className="text-center text-sm text-[#4b5563]">
      {'이미 회원이신가요? '}
      <Link to="/login" className="ml-1 font-bold text-[#0f4c3a] underline">
        로그인
      </Link>
    </p>
  );
}

// 06-3-1 이메일 인증 · 06-3-2 가입한 이메일 · 06-3-3 인증번호 틀림 · 06-3-5 하루 5번 초과
export function SignupEmailView({ emailCode, on }) {
  return (
    <SignupCard width={440}>
      <SignupStepper current={0} />
      <AuthHeading title="이메일 인증" description="가입할 이메일로 6자리 인증번호를 보내 드려요." relaxed={false} />
      <EmailCodeFields variant="signup" emailCode={emailCode} on={on} />
      {emailCode.status === 'duplicate' && (
        <div className="flex gap-2">
          <Link
            to="/reset-password"
            className="flex-1 h-11 flex items-center justify-center bg-white border border-[#d1d5db] text-sm font-semibold text-[#111827]"
          >
            비밀번호 재설정
          </Link>
          <Link to="/login" className="flex-1 h-11 flex items-center justify-center bg-[#0f4c3a] text-white text-sm font-semibold">
            로그인
          </Link>
        </div>
      )}
      <LoginPrompt />
    </SignupCard>
  );
}

// 06-3-6 정보 입력 (가입 버튼 바로 위 [필수] 이용약관 · 개인정보처리방침 동의)
export function SignupInfoView({ email, form, on, termsAgreed, onTermsChange, onNext, error }) {
  return (
    <SignupCard width={560}>
      <SignupStepper current={1} />
      <AuthHeading title="정보 입력" description={`${email} · 모든 항목을 입력해야 가입할 수 있어요`} relaxed={false} />
      <MemberInfoFields form={form} on={on} withPassword />
      <TermsAgreement agreed={termsAgreed} onChange={onTermsChange} />
      <div>
        <SubmitButton type="button" onClick={onNext}>
          다음
        </SubmitButton>
        <ActionErrorLine message={error} />
      </div>
    </SignupCard>
  );
}

function StoreIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9l1.5-5h15L21 9M3 9h18M3 9v11h18V9M8 20v-6h8v6" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 10-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

// 선택 칸 (판매자 · 구매자)
function ChoiceCard({ selected, icon, title, description, onSelect }) {
  return (
    <label
      className={
        selected
          ? 'flex-1 p-5 border-2 border-[#0f4c3a] bg-[#f4f8f6] space-y-3 cursor-pointer'
          : 'flex-1 p-5 border border-[#e5e7eb] bg-white space-y-3 cursor-pointer'
      }
    >
      <div className="flex items-start justify-between">
        <span
          className={
            selected
              ? 'w-10 h-10 flex items-center justify-center bg-[#0f4c3a] text-white'
              : 'w-10 h-10 flex items-center justify-center bg-[#f3f4f6] text-[#4b5563]'
          }
        >
          {icon}
        </span>
        {selected ? (
          <span className="w-5 h-5 flex items-center justify-center bg-[#0f4c3a] text-white">
            <StepCheck />
          </span>
        ) : (
          <span className="w-5 h-5 border-2 border-[#d1d5db] bg-white" />
        )}
      </div>
      <p className="text-[15px] font-bold text-[#111827]">{title}</p>
      <p className="text-[13px] text-[#4b5563] leading-relaxed">{description}</p>
      {/* 실제 선택 칸은 눈에 안 보이게 맨 뒤에 둠 (앞에 두면 space-y 간격이 달라짐) */}
      <input type="radio" name="signup-role" className="sr-only" checked={selected} onChange={onSelect} />
    </label>
  );
}

export const INTRO_MAX_LENGTH = 500;

// 06-3-7 판매자로 가입 · 06-3-8 구매자로 가입
// role: 'seller' | 'buyer'
// 판매자를 골랐으면 [필수] 동의를 체크해야 가입 버튼이 눌림
export function SignupSellerView({ role, intro, agreed, consentPolicy, on, onPrev, onSubmit, error, isSubmitting }) {
  const isSeller = role === 'seller';
  return (
    <SignupCard width={640}>
      <SignupStepper current={2} />
      <div className="space-y-1.5 text-center">
        <p className="text-xs font-bold text-[#0f4c3a]">판매자 등록 (선택)</p>
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">직접 키운 식물을 판매하실 계획이 있으신가요?</h1>
        <p className="text-sm text-[#4b5563]">판매자로 등록하면 바로 식물을 올릴 수 있어요. 정산은 앞에서 입력한 환급 계좌로 받아요.</p>
      </div>
      <div className="flex gap-3" role="radiogroup">
        <ChoiceCard
          selected={isSeller}
          icon={<StoreIcon />}
          title="지금 판매자 등록하기"
          description="가입하자마자 직접 키운 식물을 올려 팔 수 있어요."
          onSelect={() => on.roleChange('seller')}
        />
        <ChoiceCard
          selected={!isSeller}
          icon={<BagIcon />}
          title="나중에 등록하고 구매자로 시작하기"
          description="먼저 식물을 사 보고, 판매자 등록은 마이페이지에서 언제든 할 수 있어요."
          onSelect={() => on.roleChange('buyer')}
        />
      </div>
      {isSeller && (
        <>
          <div className="space-y-2">
            <span className="text-sm font-bold text-[#111827]">
              {'판매자 소개 '}
              <span className="text-[13px] font-normal text-[#6b7280]">(선택)</span>
            </span>
            <div className="relative">
              <textarea
                rows={4}
                maxLength={INTRO_MAX_LENGTH}
                placeholder="어떤 식물을 키우는 판매자인지 소개해 주세요. 내 상점에 보여요."
                aria-label="판매자 소개"
                className="w-full p-4 pb-9 border border-[#d1d5db] text-[15px] leading-relaxed resize-none focus:ring-0 focus:border-[#0f4c3a]"
                value={intro}
                onChange={(event) => on.introChange(event.target.value)}
              />
              <span className="absolute right-4 bottom-3 text-[13px] text-[#6b7280] tabular-nums">
                {`${intro.length} / ${INTRO_MAX_LENGTH}`}
              </span>
            </div>
          </div>
          <SellerConsentBox policy={consentPolicy} agreed={agreed} onAgreedChange={on.agreedChange} />
        </>
      )}
      <div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={isSubmitting}
            className="h-12 w-[120px] bg-white border border-[#d1d5db] text-sm font-semibold text-[#111827] shrink-0"
          >
            이전
          </button>
          {isSeller && !agreed ? (
            <button
              type="button"
              disabled
              className="flex-1 h-12 bg-[#d1d5db] border border-[#d1d5db] text-white text-base font-bold cursor-not-allowed"
            >
              판매자 등록하고 가입 완료
            </button>
          ) : (
            <button type="button" onClick={onSubmit} disabled={isSubmitting} className="flex-1 h-12 bg-[#0f4c3a] text-white text-base font-bold">
              {isSeller ? '판매자 등록하고 가입 완료' : '구매자로 가입 완료'}
            </button>
          )}
        </div>
        <ActionErrorLine message={error} />
      </div>
    </SignupCard>
  );
}

// 06-3-9 가입 완료
export function SignupDoneView({ nickname, to, error }) {
  return (
    <SignupCard width={440}>
      <SignupStepper current={3} />
      <div className="flex flex-col items-center text-center gap-4 pt-2">
        <DoneMark size="lg" />
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">가입이 완료됐어요</h1>
        <p className="text-sm text-[#4b5563]">
          {`${nickname}님, replant에 오신 걸 환영해요.`}
          <br />
          판매자로 등록했다면 지금부터 식물을 올릴 수 있어요. 나중에 등록하기를 골랐다면 마이페이지에서 언제든 등록할 수 있어요.
        </p>
      </div>
      <div>
        <Link to={to} className="w-full h-12 flex items-center justify-center bg-[#0f4c3a] text-white text-base font-bold">
          로그인하러 가기
        </Link>
        <ActionErrorLine message={error} />
      </div>
    </SignupCard>
  );
}

// 06-3-10 카카오 가입 (정보 입력 한 장, 가입 버튼 바로 위 [필수] 이용약관 · 개인정보처리방침 동의)
export function SocialSignupView({ email, remainingText, form, on, termsAgreed, onTermsChange, onSubmit, error, isSubmitting }) {
  return (
    <SignupCard width={560}>
      <AuthHeading
        title="거의 다 됐어요"
        description="replant에서 쓸 정보를 입력해 주세요. 모든 항목을 입력해야 가입할 수 있어요."
        relaxed={false}
      />
      <div className="px-4 py-3 bg-[#fffbeb] border border-[#fde68a] flex items-start justify-between gap-4">
        <p className="text-[13px] text-[#92400e] leading-relaxed">
          가입 정보는 10분 동안만 유지돼요. 시간이 지나면 카카오 로그인부터 다시 해 주세요.
        </p>
        <div className="text-right shrink-0">
          <p className="text-xs text-[#6b7280]">남은 시간</p>
          <p className="text-xl font-black text-[#b91c1c] tabular-nums">{remainingText}</p>
        </div>
      </div>
      <MemberInfoFields
        form={form}
        on={on}
        emailField={
          <label className="block space-y-2">
            <span className="text-sm font-bold text-[#111827]">이메일 (카카오)</span>
            <input
              type="text"
              value={email}
              placeholder=""
              readOnly
              className={authInputClass('default', 'bg-[#f3f4f6] text-[#4b5563]')}
            />
            <FieldHint>카카오 계정의 이메일이라 바꿀 수 없어요</FieldHint>
          </label>
        }
      />
      <TermsAgreement agreed={termsAgreed} onChange={onTermsChange} />
      <div>
        <SubmitButton type="button" onClick={onSubmit} disabled={isSubmitting}>
          가입 완료
        </SubmitButton>
        <ActionErrorLine message={error} />
      </div>
    </SignupCard>
  );
}
