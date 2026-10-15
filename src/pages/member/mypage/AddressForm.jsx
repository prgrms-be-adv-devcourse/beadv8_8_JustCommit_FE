import { useEffect, useState } from 'react';
import Button from '../../../components/common/Button';
import { loadPostcodeScript, openPostcode } from '../../../utils/postcode';
import formStyles from '../signup/SignupStep.module.css';
import styles from '../MyPage.module.css';

const PHONE_REGEX = /^01\d{9}$/;

function onlyDigits(value, maxLength) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function AddressForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    recipientName: '',
    recipientPhone: '',
    zipcode: '',
    address1: '',
    address2: '',
    addressName: '',
    isDefault: false,
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    form.recipientName.trim() !== '' &&
    PHONE_REGEX.test(form.recipientPhone) &&
    form.zipcode !== '' &&
    form.address1 !== '' &&
    !isSubmitting;

  useEffect(() => {
    loadPostcodeScript().catch(() => {});
  }, []);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSearchAddress = () => {
    openPostcode(({ zipcode, address1 }) => {
      setForm((prev) => ({ ...prev, zipcode, address1 }));
    }).catch((error) => setErrorMessage(error.message));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit({
        ...form,
        recipientName: form.recipientName.trim(),
        address2: form.address2.trim(),
        addressName: form.addressName.trim(),
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? '배송지 등록에 실패했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <form className={`${styles.formBox} ${formStyles.form}`} onSubmit={handleSubmit} noValidate>
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <div className={formStyles.field}>
        <label htmlFor="address-name" className={formStyles.label}>
          배송지 이름 <span className={formStyles.optional}>(선택)</span>
        </label>
        <input
          id="address-name"
          className={formStyles.input}
          placeholder="예: 집, 회사"
          value={form.addressName}
          onChange={(event) => updateField('addressName', event.target.value)}
          maxLength={20}
        />
      </div>

      <div className={formStyles.field}>
        <label htmlFor="address-recipient" className={formStyles.label}>
          받는 사람 <span className={formStyles.required}>*</span>
        </label>
        <input
          id="address-recipient"
          className={formStyles.input}
          placeholder="이름"
          value={form.recipientName}
          onChange={(event) => updateField('recipientName', event.target.value)}
          maxLength={20}
        />
      </div>

      <div className={formStyles.field}>
        <label htmlFor="address-phone" className={formStyles.label}>
          받는 사람 연락처 <span className={formStyles.required}>*</span>
        </label>
        <input
          id="address-phone"
          inputMode="numeric"
          className={formStyles.input}
          placeholder="숫자만 입력 (- 제외)"
          value={form.recipientPhone}
          onChange={(event) => updateField('recipientPhone', onlyDigits(event.target.value, 11))}
        />
      </div>

      <div className={formStyles.field}>
        <label htmlFor="address-zipcode" className={formStyles.label}>
          주소 <span className={formStyles.required}>*</span>
        </label>
        <div className={formStyles.row}>
          <input
            id="address-zipcode"
            className={`${formStyles.input} ${formStyles.zipcodeInput}`}
            placeholder="우편번호"
            value={form.zipcode}
            onClick={handleSearchAddress}
            readOnly
          />
          <Button className={formStyles.sideButton} onClick={handleSearchAddress}>
            우편번호 찾기
          </Button>
        </div>
        <input
          className={formStyles.input}
          placeholder="주소"
          value={form.address1}
          onClick={handleSearchAddress}
          readOnly
          aria-label="주소"
        />
        <input
          className={formStyles.input}
          placeholder="상세 주소 (동, 호수)"
          value={form.address2}
          onChange={(event) => updateField('address2', event.target.value)}
          maxLength={100}
          aria-label="상세 주소"
        />
      </div>

      <label className={formStyles.checkbox}>
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(event) => updateField('isDefault', event.target.checked)}
        />
        기본 배송지로 설정
      </label>

      <div className={styles.formActions}>
        <button type="button" className={styles.smallButton} onClick={onCancel} disabled={isSubmitting}>
          취소
        </button>
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? '저장 중...' : '배송지 저장'}
        </Button>
      </div>
    </form>
  );
}

export default AddressForm;
