import Modal from './Modal';
import ModalButton from './ModalButton';

// 이용약관 모달 (01-1-4 「11. 이용약관 보기」, Large 680px). 약관 본문은 아직 준비 중
// 푸터 「이용약관」과 회원가입 동의 칸 「이용약관 보기」가 함께 씁니다.
function TermsModal({ onClose }) {
  return (
    <Modal
      title="이용약관"
      width={680}
      bodyClassName="text-sm text-[#4b5563] max-h-[360px] overflow-y-auto space-y-4 pr-4 border-b border-[#f3f4f6]"
      onClose={onClose}
      footer={
        <ModalButton variant="primary" fit className="px-6" onClick={onClose}>
          확인
        </ModalButton>
      }
    >
      <p className="text-sm text-[#4b5563]">약관은 준비 중이에요.</p>
    </Modal>
  );
}

export default TermsModal;
