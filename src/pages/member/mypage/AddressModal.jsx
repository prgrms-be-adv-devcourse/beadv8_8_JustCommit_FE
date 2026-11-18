import { useEffect, useState } from 'react';
import { ACTION_ERROR } from '../../../constants/actionError';
import { loadPostcodeScript, openPostcode } from '../../../utils/postcode';
import AddressModalView from './AddressModalView';

// 배송지 추가 · 수정 모달 (배송지 관리 · 주문서에서 같이 씀)
// onSubmit(form): 실패하면 에러를 던져서 모달이 메시지를 보여 줌
// initial: 수정할 배송지 (없으면 추가)
// TODO: 주문서(CheckoutPage)도 쓰므로 components/member로 옮기는 것을 제안

const PHONE_REGEX = /^01\d{9}$/;

// 입력 중인 숫자를 010-1234-5678 형태로 보여 주기
function toPhoneDisplay(digits) {
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function AddressModal({ onSubmit, onClose, initial = null, showDefaultOption = true }) {
  const [form, setForm] = useState(() => ({
    addressName: initial?.addressName ?? '',
    recipientName: initial?.recipientName ?? '',
    phone: initial?.recipientPhone ?? '', // 숫자만
    zipcode: initial?.zipcode ?? '',
    address1: initial?.address1 ?? '',
    address2: initial?.address2 ?? '',
    isDefault: false,
  }));
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPostcodeScript().catch(() => {});
  }, []);

  const handleChange = (name, value) => {
    const next = name === 'phone' ? value.replace(/\D/g, '').slice(0, 11) : value;
    setForm((prev) => ({ ...prev, [name]: next }));
  };

  const handleSearchAddress = () => {
    openPostcode((result) => {
      setForm((prev) => ({ ...prev, zipcode: result.zipcode, address1: result.address1 }));
    }).catch((error) => setErrorMessage(error.message));
  };

  const phoneError = form.phone.length > 0 && !PHONE_REGEX.test(form.phone) ? '휴대폰 번호 11자리를 입력해 주세요.' : '';
  const canSubmit =
    form.recipientName.trim() !== '' && PHONE_REGEX.test(form.phone) && form.zipcode !== '' && form.address1 !== '';

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await onSubmit({
        recipientName: form.recipientName.trim(),
        recipientPhone: form.phone,
        zipcode: form.zipcode,
        address1: form.address1,
        address2: form.address2.trim(),
        addressName: form.addressName.trim(),
        isDefault: showDefaultOption && form.isDefault,
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message ?? ACTION_ERROR.DEFAULT);
      setIsSubmitting(false);
    }
  };

  return (
    <AddressModalView
      title={initial ? '배송지 수정' : '배송지 추가'}
      form={{ ...form, phoneText: toPhoneDisplay(form.phone) }}
      onChange={handleChange}
      onSearchAddress={handleSearchAddress}
      phoneError={phoneError}
      errorMessage={errorMessage}
      canSubmit={canSubmit}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onClose={onClose}
      showDefaultOption={showDefaultOption && !initial?.isDefault}
    />
  );
}

export default AddressModal;
