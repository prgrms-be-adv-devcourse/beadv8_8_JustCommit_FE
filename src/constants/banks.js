import { EMPTY } from './emptyText';
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

// 계좌 끝 4자리 → 은행 이름 (인출 내역 · 예치금 거래 내역)
// TODO: 인출 응답(CashOutHistoryResponse)에 은행(bankCode)이 없어, 내 정보(GET /api/v1/users/me)의 등록 계좌와
//       끝 4자리가 같을 때만 그 은행 이름을 돌려줌 (계좌를 바꾸기 전 인출이면 null). BE가 bankCode를 주면 그 값으로 교체
export function bankNameForLast4(accountLast4, myAccount) {
  if (!myAccount || !accountLast4) return null;
  const myLast4 = String(myAccount.maskedAccountNo ?? '').slice(-4);
  return myLast4 === accountLast4 ? getBankName(myAccount.bankCode) : null;
}

// 등록 계좌 한 줄: 「KB국민은행 ***4567 · 예금주 김*식」
// - 계좌번호는 뒤 4자리만 (응답 maskedAccountNo가 「****4567」이어도 끝 4자리만 떼어 ***를 붙임)
// - 예금주는 FE가 가리거나 풀지 않고 응답 값 그대로 (BE가 「김*식」으로 가려서 줌, 시안 06-5-7 · 06-5-8 · 07-4-1 · 07-4-2도 김*식)
// account = { bankCode, maskedAccountNo, accountHolder } (GET /api/v1/users/me 의 account)
export function formatBankAccount(account) {
  const last4 = String(account.maskedAccountNo ?? '').slice(-4);
  // 은행 · 끝 4자리 · 예금주 중 없는 값은 「-」
  return `${getBankName(account.bankCode) ?? EMPTY} ***${last4 || EMPTY} · 예금주 ${account.accountHolder ?? EMPTY}`;
}
