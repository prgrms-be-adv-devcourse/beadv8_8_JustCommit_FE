import { useEffect, useRef, useState } from 'react';
import { loadPostcodeScript, openPostcode } from '../../../utils/postcode';
import styles from './AddressModal.module.css';

const PHONE_REGEX = /^01\d{9}$/;

// 입력 중인 숫자를 010-1234-5678 형태로 보여 주기
function toPhoneDisplay(digits) {
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function AddressModal({ onSubmit, onClose }) {
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState(''); // 숫자만
  const [zipcode, setZipcode] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [addressName, setAddressName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstInputRef = useRef(null);

  const showPhoneError = recipientPhone.length > 0 && !PHONE_REGEX.test(recipientPhone);

  const canSubmit =
    recipientName.trim() !== '' &&
    PHONE_REGEX.test(recipientPhone) &&
    zipcode !== '' &&
    address1 !== '' &&
    !isSubmitting;

  useEffect(() => {
    loadPostcodeScript().catch(() => {});
    firstInputRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleSearchAddress = () => {
    openPostcode((result) => {
      setZipcode(result.zipcode);
      setAddress1(result.address1);
    }).catch((error) => setErrorMessage(error.message));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await onSubmit({
        recipientName: recipientName.trim(),
        recipientPhone,
        zipcode,
        address1,
        address2: address2.trim(),
        addressName: addressName.trim(),
        isDefault: false, // 기본 배송지는 목록에서 설정
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? '배송지 등록에 실패했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="address-modal-title">
        <div className={styles.header}>
          <h2 id="address-modal-title" className={styles.title}>배송지 추가</h2>
          <button type="button" className={styles.closeButton} aria-label="닫기" onClick={onClose}>
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}

          <label className={styles.field}>
            <span className={styles.label}>받는 사람</span>
            <input
              ref={firstInputRef}
              className={styles.input}
              placeholder="이름"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              maxLength={20}
              disabled={isSubmitting}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              배송지 이름 <span className={styles.optional}>(선택)</span>
            </span>
            <input
              className={styles.input}
              placeholder="예) 집, 회사"
              value={addressName}
              onChange={(e) => setAddressName(e.target.value)}
              maxLength={20}
              disabled={isSubmitting}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>연락처</span>
            <input
              className={styles.input}
              inputMode="numeric"
              placeholder="010-0000-0000"
              value={toPhoneDisplay(recipientPhone)}
              onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              disabled={isSubmitting}
              aria-invalid={showPhoneError}
            />
            {showPhoneError && <span className={styles.fieldError}>휴대폰 번호 11자리를 입력해 주세요.</span>}
          </label>

          <div className={styles.field}>
            <span id="address-label" className={styles.label}>주소</span>
            <div className={styles.row}>
              <input
                className={`${styles.input} ${styles.readonly} ${styles.zipcode}`}
                placeholder="우편번호"
                value={zipcode}
                onClick={handleSearchAddress}
                readOnly
                aria-labelledby="address-label"
              />
              <button
                type="button"
                className={styles.searchButton}
                onClick={handleSearchAddress}
                disabled={isSubmitting}
              >
                주소 검색
              </button>
            </div>
            <input
              className={`${styles.input} ${styles.readonly}`}
              placeholder="주소"
              value={address1}
              onClick={handleSearchAddress}
              readOnly
              aria-label="주소"
            />
            <input
              className={styles.input}
              placeholder="상세 주소 (선택)"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              maxLength={100}
              aria-label="상세 주소"
              disabled={isSubmitting}
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={!canSubmit}>
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddressModal;
