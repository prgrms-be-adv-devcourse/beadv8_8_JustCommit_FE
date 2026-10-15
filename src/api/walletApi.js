import client from './client';

// 예치금 잔액 → { balance }
export function getWalletBalance() {
  return client.get('/api/v1/wallet');
}
