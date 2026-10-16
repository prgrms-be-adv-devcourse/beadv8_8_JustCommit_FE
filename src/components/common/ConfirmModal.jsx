import { useEffect, useRef } from 'react';
import styles from './ConfirmModal.module.css';

// 공통 확인 팝업: 바깥 클릭·Esc·취소 = onClose, 확인 버튼 = onConfirm
function ConfirmModal({
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  icon = 'lock',
  onConfirm,
  onClose,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    // 팝업이 떠 있는 동안 뒤 페이지 스크롤 막기
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        <span className={`material-symbols-outlined ${styles.icon}`} aria-hidden="true">
          {icon}
        </span>
        <h2 id="confirm-modal-title" className={styles.title}>{title}</h2>
        <p id="confirm-modal-message" className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            {cancelText}
          </button>
          <button type="button" ref={confirmRef} className={styles.confirmButton} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
