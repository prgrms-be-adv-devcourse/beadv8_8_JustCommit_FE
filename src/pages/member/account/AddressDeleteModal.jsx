import { ActionErrorBar } from '../../../components/common/ActionError';
import Modal from '../../../components/common/Modal';
import ModalButton from '../../../components/common/ModalButton';

// 시안 06-5-11 배송지 삭제 확인
// address = { addressLine: '배송지 이름 · 주소' }
function AddressDeleteModal({ address, deleting, error, onClose, onConfirm }) {
  return (
    <Modal
      title="배송지를 삭제할까요?"
      width={440}
      top={180}
      onClose={deleting ? undefined : onClose}
      footer={
        <>
          <ModalButton onClick={onClose} disabled={deleting}>
            취소
          </ModalButton>
          <ModalButton variant="danger" onClick={onConfirm} disabled={deleting}>
            삭제
          </ModalButton>
        </>
      }
    >
      <p className="text-[#4b5563] leading-relaxed">삭제한 배송지는 되돌릴 수 없어요.</p>
      <dl className="border border-[#e5e7eb] divide-y divide-[#e5e7eb]">
        <div className="px-4 py-3 flex justify-between gap-4">
          <dt className="text-[#6b7280] shrink-0">배송지</dt>
          <dd className="text-[#111827] font-medium text-right">{address.addressLine}</dd>
        </div>
      </dl>
      <ActionErrorBar message={error} />
    </Modal>
  );
}

export default AddressDeleteModal;
