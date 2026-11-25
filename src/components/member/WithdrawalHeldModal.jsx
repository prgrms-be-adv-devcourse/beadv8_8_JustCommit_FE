import Modal from '../common/Modal';
import ModalButton from '../common/ModalButton';

// 카카오 연결 해제 뒤 탈퇴가 보류됐던 회원이 다시 로그인해 복구됐을 때 홈에서 한 번 띄우는 팝업 (BE #616)
// 시안에 없는 팝업이라 공통 모달 모양을 따름. 막힌 이유는 여기 나열하지 않고 탈퇴 화면이 그때 조회해 보여 줌
function WithdrawalHeldModal({ onClose, onGoWithdraw }) {
  return (
    <Modal
      title="카카오 계정이 다시 연결됐어요"
      width={440}
      onClose={onClose}
      footer={
        <>
          <ModalButton onClick={onClose}>닫기</ModalButton>
          <ModalButton variant="primary" fit onClick={onGoWithdraw}>
            탈퇴 화면 바로가기
          </ModalButton>
        </>
      }
    >
      <p className="text-[#4b5563] leading-relaxed">
        카카오 연결을 끊은 뒤 탈퇴가 보류됐던 계정이에요. 다시 로그인해서 계정을 그대로 이용할 수
        있어요.
      </p>
      <p className="text-[#4b5563] leading-relaxed">
        탈퇴하려면 탈퇴 화면에서 지금 탈퇴할 수 있는지 확인해 주세요.
      </p>
    </Modal>
  );
}

export default WithdrawalHeldModal;
