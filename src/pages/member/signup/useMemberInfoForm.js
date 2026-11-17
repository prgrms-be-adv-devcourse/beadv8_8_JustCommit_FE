import { useEffect, useState } from 'react';
import { checkNickname, checkPhone } from '../../../api/memberApi';
import { BANKS } from '../../../constants/banks';
import { loadPostcodeScript, openPostcode } from '../../../utils/postcode';
import { ACCOUNT_NO_REGEX, NICKNAME_REGEX, PHONE_REGEX, formatPhone, isValidPassword, onlyDigits } from './memberRules';

// 회원가입 정보 입력 (06-3-5) · 카카오 가입 (06-3-9) 공통 상태
// 반환: form · on (MemberInfoFields에 그대로 넘김), validate(), toProfileRequest()

function getMessage(error, fallback) {
  return error.response?.data?.message ?? fallback;
}

// 중복 확인 칸 하나 (닉네임 · 휴대폰)
function useCheckedValue({ isValid, invalidText, check, availableText, takenText, failText }) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('idle'); // idle · checking · available · taken · invalid
  const [message, setMessage] = useState(null);

  const change = (next) => {
    setValue(next);
    setStatus('idle');
    setMessage(null);
  };

  const runCheck = async () => {
    if (status === 'checking') return;
    if (!isValid(value)) {
      setStatus('invalid');
      setMessage({ type: 'error', text: invalidText });
      return;
    }
    setStatus('checking');
    setMessage(null);
    try {
      const response = await check(value);
      const { available } = response.data.data;
      setStatus(available ? 'available' : 'taken');
      setMessage(available ? { type: 'success', text: availableText } : { type: 'error', text: takenText });
    } catch (error) {
      setStatus('idle');
      setMessage({ type: 'error', text: getMessage(error, failText) });
    }
  };

  let state = 'default';
  if (status === 'available') state = 'success';
  else if (status === 'taken' || status === 'invalid') state = 'error';

  return { value, status, message, state, change, runCheck };
}

function useMemberInfoForm({ withPassword }) {
  const nickname = useCheckedValue({
    isValid: (value) => NICKNAME_REGEX.test(value),
    invalidText: '닉네임은 한글 · 영문 · 숫자 2 ~ 8자로 정해 주세요',
    check: checkNickname,
    availableText: '사용할 수 있는 닉네임이에요',
    takenText: '이미 사용 중인 닉네임이에요',
    failText: '닉네임을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.',
  });
  const phone = useCheckedValue({
    isValid: (value) => PHONE_REGEX.test(value),
    invalidText: '휴대폰 번호는 01로 시작하는 11자리로 입력해 주세요',
    check: checkPhone,
    availableText: '사용할 수 있는 번호예요',
    takenText: '이미 가입한 번호예요',
    failText: '휴대폰 번호를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.',
  });

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [addressName, setAddressName] = useState('');
  const [addressMessage, setAddressMessage] = useState(null);

  useEffect(() => {
    loadPostcodeScript().catch(() => {});
  }, []);

  const isPasswordValid = isValidPassword(password);
  const isMismatch = confirm.length > 0 && password !== confirm;

  const form = {
    nickname: nickname.value,
    nicknameState: nickname.state,
    nicknameMessage: nickname.message,
    password,
    passwordState: password && !isPasswordValid ? 'error' : 'default',
    confirm,
    confirmState: isMismatch ? 'error' : 'default',
    confirmMessage: isMismatch ? { type: 'error', text: '비밀번호가 일치하지 않아요' } : null,
    phone: formatPhone(phone.value),
    phoneState: phone.state,
    phoneMessage: phone.message,
    bankCode,
    bankName: BANKS.find((bank) => bank.code === bankCode)?.name ?? '',
    accountNo,
    accountState: accountNo && !ACCOUNT_NO_REGEX.test(accountNo) ? 'error' : 'default',
    accountHolder,
    recipientName,
    recipientPhone: formatPhone(recipientPhone),
    zipcode,
    address1,
    address2,
    addressName,
    addressMessage,
  };

  const searchAddress = () => {
    setAddressMessage(null);
    openPostcode(({ zipcode: nextZipcode, address1: nextAddress1 }) => {
      setZipcode(nextZipcode);
      setAddress1(nextAddress1);
    }).catch((error) => setAddressMessage({ type: 'error', text: error.message }));
  };

  const on = {
    nicknameChange: nickname.change,
    nicknameCheck: nickname.runCheck,
    passwordChange: setPassword,
    confirmChange: setConfirm,
    phoneChange: (value) => phone.change(onlyDigits(value, 11)),
    phoneCheck: phone.runCheck,
    bankChange: setBankCode,
    accountNoChange: (value) => setAccountNo(onlyDigits(value, 14)),
    accountHolderChange: setAccountHolder,
    recipientNameChange: setRecipientName,
    recipientPhoneChange: (value) => setRecipientPhone(onlyDigits(value, 11)),
    searchAddress,
    address2Change: setAddress2,
    addressNameChange: setAddressName,
  };

  // 다음 · 가입 완료 전에 확인. 문제가 있으면 안내 문구, 없으면 null
  const validate = () => {
    if (nickname.status !== 'available') return '닉네임 중복 확인을 해 주세요';
    if (withPassword && !isPasswordValid) return '비밀번호는 8 ~ 20자, 영문과 숫자를 모두 넣어 주세요';
    if (withPassword && password !== confirm) return '비밀번호가 일치하지 않아요';
    if (phone.status !== 'available') return '휴대폰 번호 중복 확인을 해 주세요';
    if (!bankCode) return '은행을 골라 주세요';
    if (!ACCOUNT_NO_REGEX.test(accountNo)) return '계좌번호는 - 없이 숫자 10 ~ 14자리로 입력해 주세요';
    if (!accountHolder.trim()) return '예금주를 입력해 주세요';
    if (!recipientName.trim()) return '받는 사람을 입력해 주세요';
    if (!PHONE_REGEX.test(recipientPhone)) return '받는 사람 연락처는 01로 시작하는 11자리로 입력해 주세요';
    if (!zipcode || !address1) return '주소를 검색해 주세요';
    return null;
  };

  // 백엔드 SocialSignupRequest 형식 (일반 가입은 여기에 email · password를 더함)
  const toProfileRequest = () => ({
    nickname: nickname.value,
    phone: phone.value,
    bankCode,
    accountNo,
    accountHolder: accountHolder.trim(),
    recipientName: recipientName.trim(),
    recipientPhone,
    zipcode,
    address1,
    address2: address2.trim(),
    addressName: addressName.trim(),
  });

  return { form, on, validate, toProfileRequest, password, nickname: nickname.value };
}

export default useMemberInfoForm;
