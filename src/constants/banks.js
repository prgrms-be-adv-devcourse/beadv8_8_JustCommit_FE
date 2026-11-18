// 은행 코드 (금융결제원 표준 3자리)
// name: 화면에 보이는 은행 이름 (회원가입 은행 선택 · 등록 계좌 · 인출 계좌 모두 이 이름 그대로)
export const BANKS = [
  { code: '004', name: 'KB국민은행' },
  { code: '088', name: '신한은행' },
  { code: '020', name: '우리은행' },
  { code: '081', name: '하나은행' },
  { code: '011', name: 'NH농협은행' },
  { code: '003', name: 'IBK기업은행' },
  { code: '090', name: '카카오뱅크' },
  { code: '092', name: '토스뱅크' },
  { code: '089', name: '케이뱅크' },
  { code: '023', name: 'SC제일은행' },
];

export function getBankName(bankCode) {
  return BANKS.find((bank) => bank.code === bankCode)?.name ?? bankCode;
}

// 등록 계좌 한 줄: 「KB국민은행 ***4567 · 예금주 김*식」
// - 계좌번호는 뒤 4자리만 (응답 maskedAccountNo가 「****4567」이어도 끝 4자리만 떼어 ***를 붙임)
// - 예금주는 FE가 가리거나 풀지 않고 응답 값 그대로 (BE가 「김*식」으로 가려서 줌, 시안 06-5-6 · 06-5-7 · 07-4-1 · 07-4-2도 김*식)
// account = { bankCode, maskedAccountNo, accountHolder } (GET /api/v1/users/me 의 account)
export function formatBankAccount(account) {
  const last4 = String(account.maskedAccountNo ?? '').slice(-4);
  return `${getBankName(account.bankCode)} ***${last4} · 예금주 ${account.accountHolder}`;
}
