// 회원 입력 규칙 (BE docs/services/member.md 「정책 · 입력 규칙」)
// 비밀번호 8~20자 영문 · 숫자 각 1개 이상 · 닉네임 2~8자 · 휴대폰 01로 시작 11자리

const PASSWORD_ALLOWED_CHARS = /^[A-Za-z\d!@#$%^&*]*$/;
export const NICKNAME_REGEX = /^[가-힣A-Za-z0-9]{2,8}$/;
export const PHONE_REGEX = /^01\d{9}$/;
export const ACCOUNT_NO_REGEX = /^\d{10,14}$/;

export function isValidPassword(password) {
  return (
    password.length >= 8 &&
    password.length <= 20 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password) &&
    PASSWORD_ALLOWED_CHARS.test(password)
  );
}

export function onlyDigits(value, maxLength) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

// 숫자만 저장하고 화면에는 010-1234-5678 형태로 보여 줌
export function formatPhone(digits) {
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
