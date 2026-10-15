import { useEffect, useState } from 'react';
import Button from '../../../components/common/Button';
import { checkNickname, checkPhone } from '../../../api/memberApi';
import { loadPostcodeScript, openPostcode } from '../../../utils/postcode';
import FieldMessage from './FieldMessage';
import styles from './SignupStep.module.css';

const NICKNAME_REGEX = /^[가-힣A-Za-z0-9]{2,8}$/;
const PHONE_REGEX = /^01\d{9}$/;

function onlyDigits(value, maxLength) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message ?? fallback;
}

function ProfileStep({ initialData, onNext, onPrev }) {
  const [nickname, setNickname] = useState(initialData.nickname ?? '');
  const [nicknameStatus, setNicknameStatus] = useState(initialData.nickname ? 'available' : 'idle');
  const [nicknameMessage, setNicknameMessage] = useState(null);

  const [phone, setPhone] = useState(initialData.phone ?? '');
  const [phoneStatus, setPhoneStatus] = useState(initialData.phone ? 'available' : 'idle');
  const [phoneMessage, setPhoneMessage] = useState(null);

  const [recipientName, setRecipientName] = useState(initialData.recipientName ?? '');
  const [sameAsPhone, setSameAsPhone] = useState(initialData.sameAsPhone ?? true);
  const [recipientPhoneInput, setRecipientPhoneInput] = useState(
    initialData.sameAsPhone === false ? initialData.recipientPhone : '',
  );

  const [zipcode, setZipcode] = useState(initialData.zipcode ?? '');
  const [address1, setAddress1] = useState(initialData.address1 ?? '');
  const [address2, setAddress2] = useState(initialData.address2 ?? '');
  const [addressName, setAddressName] = useState(initialData.addressName ?? '');
  const [addressMessage, setAddressMessage] = useState(null);

  const recipientPhone = sameAsPhone ? phone : recipientPhoneInput;

  const isRecipientNameValid = recipientName.trim().length > 0;
  const isRecipientPhoneValid = PHONE_REGEX.test(recipientPhone);
  const canProceed =
    nicknameStatus === 'available' &&
    phoneStatus === 'available' &&
    isRecipientNameValid &&
    isRecipientPhoneValid &&
    zipcode !== '' &&
    address1 !== '';

  useEffect(() => {
    loadPostcodeScript().catch(() => {});
  }, []);

  const handleNicknameChange = (event) => {
    setNickname(event.target.value);
    setNicknameStatus('idle');
    setNicknameMessage(null);
  };

  const handleCheckNickname = async () => {
    if (!NICKNAME_REGEX.test(nickname)) {
      setNicknameMessage({ type: 'error', text: '닉네임은 한글, 영문, 숫자 2~8자여야 합니다.' });
      return;
    }

    setNicknameStatus('checking');
    setNicknameMessage(null);

    try {
      const response = await checkNickname(nickname);
      const { available } = response.data.data;

      setNicknameStatus(available ? 'available' : 'taken');
      setNicknameMessage(
        available
          ? { type: 'success', text: '사용할 수 있는 닉네임입니다.' }
          : { type: 'error', text: '이미 사용 중인 닉네임입니다.' },
      );
    } catch (error) {
      setNicknameStatus('idle');
      setNicknameMessage({ type: 'error', text: getErrorMessage(error, '닉네임 확인에 실패했습니다.') });
    }
  };

  const handlePhoneChange = (event) => {
    setPhone(onlyDigits(event.target.value, 11));
    setPhoneStatus('idle');
    setPhoneMessage(null);
  };

  const handleCheckPhone = async () => {
    if (!PHONE_REGEX.test(phone)) {
      setPhoneMessage({ type: 'error', text: '휴대폰 번호는 하이픈 없이 숫자 11자리여야 합니다.' });
      return;
    }

    setPhoneStatus('checking');
    setPhoneMessage(null);

    try {
      const response = await checkPhone(phone);
      const { available } = response.data.data;

      setPhoneStatus(available ? 'available' : 'taken');
      setPhoneMessage(
        available
          ? { type: 'success', text: '사용할 수 있는 휴대폰 번호입니다.' }
          : { type: 'error', text: '이미 가입된 휴대폰 번호입니다.' },
      );
    } catch (error) {
      setPhoneStatus('idle');
      setPhoneMessage({ type: 'error', text: getErrorMessage(error, '휴대폰 번호 확인에 실패했습니다.') });
    }
  };

  const handleSearchAddress = () => {
    setAddressMessage(null);
    openPostcode(({ zipcode: newZipcode, address1: newAddress1 }) => {
      setZipcode(newZipcode);
      setAddress1(newAddress1);
    }).catch((error) => {
      setAddressMessage({ type: 'error', text: error.message });
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canProceed) return;

    onNext({
      nickname,
      phone,
      recipientName: recipientName.trim(),
      recipientPhone,
      sameAsPhone,
      zipcode,
      address1,
      address2: address2.trim(),
      addressName: addressName.trim(),
    });
  };

  return (
    <section className={styles.card}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div>
          <h2 className={styles.title}>식물 생활에 필요한 기본 정보를 입력해 주세요</h2>
          <p className={styles.subtitle}>거래와 배송에 사용할 정보입니다.</p>
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor="signup-nickname" className={styles.label}>
              닉네임 <span className={styles.required}>*</span>
            </label>
            <span className={styles.hint}>한글, 영문, 숫자 2~8자</span>
          </div>
          <div className={styles.row}>
            <input
              id="signup-nickname"
              className={styles.input}
              placeholder="예: 몬스테라집사"
              value={nickname}
              onChange={handleNicknameChange}
              maxLength={8}
            />
            <Button
              className={styles.sideButton}
              onClick={handleCheckNickname}
              disabled={!nickname || nicknameStatus === 'checking' || nicknameStatus === 'available'}
            >
              {nicknameStatus === 'checking' ? '확인 중...' : '중복 확인'}
            </Button>
          </div>
          <FieldMessage message={nicknameMessage} />
        </div>

        <div className={styles.field}>
          <label htmlFor="signup-phone" className={styles.label}>
            휴대폰 번호 <span className={styles.required}>*</span>
          </label>
          <div className={styles.row}>
            <input
              id="signup-phone"
              inputMode="numeric"
              className={styles.input}
              placeholder="숫자만 입력 (- 제외)"
              value={phone}
              onChange={handlePhoneChange}
              autoComplete="tel"
            />
            <Button
              className={styles.sideButton}
              onClick={handleCheckPhone}
              disabled={!phone || phoneStatus === 'checking' || phoneStatus === 'available'}
            >
              {phoneStatus === 'checking' ? '확인 중...' : '중복 확인'}
            </Button>
          </div>
          <FieldMessage message={phoneMessage} />
        </div>

        <h3 className={styles.sectionTitle}>기본 배송지</h3>

        <div className={styles.field}>
          <label htmlFor="signup-recipient-name" className={styles.label}>
            받는 사람 <span className={styles.required}>*</span>
          </label>
          <input
            id="signup-recipient-name"
            className={styles.input}
            placeholder="이름"
            value={recipientName}
            onChange={(event) => setRecipientName(event.target.value)}
            maxLength={20}
            autoComplete="name"
          />
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor="signup-recipient-phone" className={styles.label}>
              받는 사람 연락처 <span className={styles.required}>*</span>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={sameAsPhone}
                onChange={(event) => setSameAsPhone(event.target.checked)}
              />
              휴대폰 번호와 동일
            </label>
          </div>
          <input
            id="signup-recipient-phone"
            inputMode="numeric"
            className={styles.input}
            placeholder="숫자만 입력 (- 제외)"
            value={recipientPhone}
            onChange={(event) => setRecipientPhoneInput(onlyDigits(event.target.value, 11))}
            disabled={sameAsPhone}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="signup-zipcode" className={styles.label}>
            주소 <span className={styles.required}>*</span>
          </label>
          <div className={styles.row}>
            <input
              id="signup-zipcode"
              className={`${styles.input} ${styles.zipcodeInput}`}
              placeholder="우편번호"
              value={zipcode}
              onClick={handleSearchAddress}
              readOnly
            />
            <Button className={styles.sideButton} onClick={handleSearchAddress}>
              우편번호 찾기
            </Button>
          </div>
          <input
            className={styles.input}
            placeholder="주소"
            value={address1}
            onClick={handleSearchAddress}
            readOnly
            aria-label="주소"
          />
          <input
            className={styles.input}
            placeholder="상세 주소 (동, 호수)"
            value={address2}
            onChange={(event) => setAddress2(event.target.value)}
            maxLength={100}
            aria-label="상세 주소"
          />
          <FieldMessage message={addressMessage} />
        </div>

        <div className={styles.field}>
          <label htmlFor="signup-address-name" className={styles.label}>
            배송지 이름 <span className={styles.optional}>(선택)</span>
          </label>
          <input
            id="signup-address-name"
            className={styles.input}
            placeholder="예: 집, 회사"
            value={addressName}
            onChange={(event) => setAddressName(event.target.value)}
            maxLength={20}
          />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.prevButton} onClick={onPrev}>
            <span className="material-symbols-outlined">arrow_back</span>
            이전
          </button>
          <Button
            type="submit"
            disabled={!canProceed}
            rightIcon="arrow_forward"
            className={styles.nextButton}
          >
            다음 단계로 (계좌 등록)
          </Button>
        </div>
      </form>
    </section>
  );
}

export default ProfileStep;
