import { Link } from 'react-router-dom';
import { ActionErrorLine } from '../../../components/common/ActionError';
import Modal from '../../../components/common/Modal';
import ModalButton from '../../../components/common/ModalButton';
import AccountLayout from './AccountLayout';
import { CardTitle, CheckBox, SubmitButton } from './AccountUi';

// 시안 06-5-9 회원 탈퇴 · 06-5-10 탈퇴 불가 모달
// props: agreed, onAgreeChange, isSubmitting, onSubmit, submitError,
//        blockers = [{ label, valueText, linkLabel, to }] (있으면 탈퇴 불가 모달), onCloseBlocked
function WithdrawView({ agreed, onAgreeChange, isSubmitting, onSubmit, submitError, blockers, onCloseBlocked }) {
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
        <CheckBox checked={agreed} onChange={onAgreeChange}>
          위 내용을 모두 확인했고 탈퇴에 동의해요
        </CheckBox>
        <div>
          <SubmitButton variant="danger" disabled={!agreed || isSubmitting} onClick={onSubmit}>
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
                <span className="flex-1 text-[#111827]">
                  {`${item.label} `}
                  <b className="tabular-nums">{item.valueText}</b>
                </span>
                <Link to={item.to} className="text-[13px] font-semibold text-[#0f4c3a] underline whitespace-nowrap">
                  {item.linkLabel}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-[#6b7280] leading-relaxed">예치금은 충전 취소나 계좌 인출로 정리할 수 있어요.</p>
        </Modal>
      )}
    </>
  );
}

export default WithdrawView;
