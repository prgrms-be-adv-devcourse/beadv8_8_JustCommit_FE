import { Link } from 'react-router-dom';
import { ActionErrorLine } from '../../../components/common/ActionError';
import Modal from '../../../components/common/Modal';
import ModalButton from '../../../components/common/ModalButton';
import { AlertIcon } from '../../../components/member/AuthField';
import AccountLayout from './AccountLayout';
import { CardTitle, CheckBox, CheckLine, SideButton, SubmitButton } from './AccountUi';
import { inputClass } from './accountStyle';

// 시안 06-5-13 회원 탈퇴 (일반 회원: 현재 비밀번호) · 06-5-14 현재 비밀번호 틀림 · 06-5-15 카카오 가입 회원(이메일 인증)
//      06-5-16 탈퇴 불가 모달 · 06-5-17 확인 실패 모달
// props: agreed, onAgreeChange, isSubmitting, onSubmit, canSubmit, submitError,
//        isKakao (카카오 가입 회원이면 이메일 인증, 아니면 현재 비밀번호)
//        일반 회원: password, onPasswordChange, passwordError('wrong' | 'locked' | '')
//        카카오: emailVerify = { email, codeSent, resendSeconds, codeSecondsText('4:18'), code, onCodeChange,
//                                onSend, onVerify, verifyError, isVerified }
//        blockers = [{ label, valueText(없으면 ''), linkLabel, to }] (있으면 탈퇴 불가 모달), onCloseBlocked,
//        isUnavailable (탈퇴 확인 결과 UNAVAILABLE), onCloseUnavailable

function ErrorLine({ children }) {
  return (
    <p role="alert" className="flex items-center gap-1.5 text-[13px] font-medium text-[#b91c1c]">
      <AlertIcon />
      {children}
    </p>
  );
}

function PasswordField({ password, onPasswordChange, passwordError }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-[#111827]">현재 비밀번호</span>
      <input
        type="password"
        value={password}
        placeholder="현재 비밀번호"
        autoComplete="current-password"
        className={inputClass('', passwordError ? 'border-[#b91c1c]' : 'border-[#d1d5db]')}
        onChange={(event) => onPasswordChange(event.target.value)}
      />
      {passwordError === 'wrong' && <ErrorLine>현재 비밀번호가 맞지 않아요</ErrorLine>}
      {/* 429 잠김: 시안에 없는 상태라 06-5-14와 같은 모양으로 문구만 바꿈 */}
      {passwordError === 'locked' && <ErrorLine>현재 비밀번호를 5번 틀려서 24시간 동안 확인할 수 없어요</ErrorLine>}
      {passwordError ? (
        <p className="text-[13px] text-[#6b7280]">
          {'5번 틀리면 24시간 동안 비밀번호를 확인할 수 없어요. 비밀번호가 기억나지 않으면 '}
          <Link to="/reset-password" className="font-semibold text-[#0f4c3a] underline">
            비밀번호 재설정
          </Link>
          을 해 주세요.
        </p>
      ) : (
        <p className="text-[13px] text-[#6b7280]">본인 확인을 위해 지금 쓰는 비밀번호를 입력해 주세요</p>
      )}
    </label>
  );
}

const KAKAO_HINT = '카카오로 가입한 회원은 가입한 이메일로 본인 확인을 해요 · 인증을 마치면 10분 안에 탈퇴해 주세요';

function EmailVerifyFields({
  email,
  codeSent,
  resendSeconds,
  codeSecondsText,
  code,
  onCodeChange,
  onSend,
  onVerify,
  verifyError,
  isVerified,
}) {
  return (
    <>
      <div className="space-y-2">
        <span className="text-sm font-bold text-[#111827]">이메일 인증</span>
        <div className="flex gap-2">
          <input type="text" value={email} readOnly placeholder="" aria-label="이메일" className={inputClass('flex-1')} />
          {!codeSent || isVerified ? (
            <SideButton variant={isVerified ? 'disabled' : 'outline'} onClick={onSend}>
              인증번호 받기
            </SideButton>
          ) : resendSeconds > 0 ? (
            <SideButton variant="disabled">{`다시 받기 (${resendSeconds}초)`}</SideButton>
          ) : (
            <SideButton onClick={onSend}>다시 받기</SideButton>
          )}
        </div>
        {isVerified && <CheckLine>이메일 인증을 마쳤어요</CheckLine>}
        {!isVerified && codeSent && <CheckLine>인증번호를 보냈어요. 메일함을 확인해 주세요.</CheckLine>}
        {!codeSent && <ActionErrorLine message={verifyError} className="" />}
      </div>
      {codeSent && !isVerified ? (
        <div className="space-y-2">
          <span className="text-sm font-bold text-[#111827]">인증번호</span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                placeholder="6자리 숫자"
                aria-label="인증번호"
                className={inputClass('tracking-widest', 'border-[#0f4c3a]')}
                onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#b91c1c] tabular-nums">
                {codeSecondsText}
              </span>
            </div>
            <SideButton variant="primary" onClick={onVerify}>
              확인
            </SideButton>
          </div>
          <ActionErrorLine message={verifyError} className="" />
          <p className="text-[13px] text-[#6b7280]">{KAKAO_HINT}</p>
        </div>
      ) : (
        <p className="text-[13px] text-[#6b7280]">{KAKAO_HINT}</p>
      )}
    </>
  );
}

function WithdrawView({
  agreed,
  onAgreeChange,
  isSubmitting,
  onSubmit,
  canSubmit,
  submitError,
  isKakao = false,
  password = '',
  onPasswordChange = () => {},
  passwordError = '',
  emailVerify = {},
  blockers,
  onCloseBlocked,
  isUnavailable,
  onCloseUnavailable,
}) {
  return (
    <>
      <AccountLayout active="withdraw">
        <CardTitle title="회원 탈퇴" description="탈퇴하면 되돌릴 수 없어요. 아래 내용을 꼭 확인해 주세요." />
        <ul className="p-5 bg-[#f9fafb] border border-[#e5e7eb] space-y-2 text-sm text-[#111827] leading-relaxed list-disc pl-9">
          <li>이메일 · 휴대폰 · 계좌 · 배송지 같은 개인정보는 지워지고, 남은 기록은 &quot;탈퇴한 회원&quot;으로 보여요.</li>
          <li>판매 중 · 검수 중 · 반려된 상품은 삭제돼요. 판매 완료된 상품 기록은 남아요.</li>
          <li>같은 이메일 · 휴대폰 번호로는 30일 동안 다시 가입할 수 없어요.</li>
          <li>카카오로 가입했다면 카카오 연결도 함께 끊어요.</li>
        </ul>
        <div className="space-y-3">
          <p className="text-sm font-bold text-[#111827]">이런 경우에는 탈퇴할 수 없어요</p>
          <ul className="space-y-1.5 text-sm text-[#4b5563] leading-relaxed list-disc pl-5">
            <li>구매 확정 전인 주문이 있을 때 (구매 · 판매 모두, 결제 대기 · 판매자 수락 대기 포함)</li>
            <li>예치금 잔액이 남아 있을 때 · 진행 중인 충전 · 충전 취소 · 인출이 있을 때</li>
            <li>아직 지급되지 않은 정산이나 미수금이 있을 때</li>
          </ul>
          <p className="text-[13px] text-[#6b7280]">예치금은 탈퇴 전에 충전 취소나 계좌 인출로 직접 정리해 주세요.</p>
        </div>
        {isKakao ? (
          <EmailVerifyFields {...emailVerify} />
        ) : (
          <PasswordField password={password} onPasswordChange={onPasswordChange} passwordError={passwordError} />
        )}
        <CheckBox checked={agreed} onChange={onAgreeChange}>
          위 내용을 모두 확인했고 탈퇴에 동의해요
        </CheckBox>
        <div>
          <SubmitButton variant="danger" disabled={!canSubmit || isSubmitting} onClick={onSubmit}>
            탈퇴하기
          </SubmitButton>
          <ActionErrorLine message={submitError} />
        </div>
      </AccountLayout>
      {blockers && (
        <Modal
          title="지금은 탈퇴할 수 없어요"
          width={480}
          onClose={onCloseBlocked}
          footer={
            <ModalButton variant="primary" onClick={onCloseBlocked}>
              확인
            </ModalButton>
          }
        >
          <p className="text-[#4b5563] leading-relaxed">아래 항목을 정리한 뒤 다시 시도해 주세요.</p>
          <ul className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
            {blockers.map((item) => (
              <li key={item.label} className="px-4 py-3 flex items-center gap-3">
                {item.valueText ? (
                  <span className="flex-1 text-[#111827]">
                    {`${item.label} `}
                    <b className="tabular-nums">{item.valueText}</b>
                  </span>
                ) : (
                  <span className="flex-1 text-[#111827]">{item.label}</span>
                )}
                <Link to={item.to} className="text-[13px] font-semibold text-[#0f4c3a] underline whitespace-nowrap">
                  {item.linkLabel}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-[#6b7280] leading-relaxed">예치금은 충전 취소나 계좌 인출로 정리할 수 있어요.</p>
        </Modal>
      )}
      {isUnavailable && (
        <Modal
          title="지금은 확인할 수 없어요"
          width={480}
          onClose={onCloseUnavailable}
          footer={
            <ModalButton variant="primary" onClick={onCloseUnavailable}>
              확인
            </ModalButton>
          }
        >
          <p className="text-[#4b5563] leading-relaxed">탈퇴할 수 있는지 확인하지 못했어요. 잠시 후 다시 시도해 주세요.</p>
        </Modal>
      )}
    </>
  );
}

export default WithdrawView;
