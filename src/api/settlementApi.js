import client from './client';

// TODO: 정산 API 명세 확정 후 USE_DUMMY 를 false 로 바꾸고 주소·필드명 확인
const USE_DUMMY = true;

// 시안(11-H 정산) 값 — 즉시 정산이라 모두 정산 완료 건
const DUMMY_SETTLEMENTS = [
  {
    settlementId: 6,
    date: '2026-10-15',
    productName: '몬스테라 알보 (잎 7장, 60cm)',
    saleAmount: 45000,
    fee: 4500,
    payoutAmount: 40500,
  },
  {
    settlementId: 5,
    date: '2026-10-14',
    productName: '안스리움 크리스탈리넘 소형',
    saleAmount: 50000,
    fee: 5000,
    payoutAmount: 45000,
  },
  {
    settlementId: 4,
    date: '2026-10-13',
    productName: '스킨답서스 픽투스 실버',
    saleAmount: 12000,
    fee: 1200,
    payoutAmount: 10800,
  },
  {
    settlementId: 3,
    date: '2026-10-08',
    productName: '필레아 페페로미오이데스',
    saleAmount: 9000,
    fee: 900,
    payoutAmount: 8100,
  },
  {
    settlementId: 2,
    date: '2026-10-02',
    productName: '호야 카르노사 컴팩타 행잉',
    saleAmount: 22000,
    fee: 2200,
    payoutAmount: 19800,
  },
  {
    settlementId: 1,
    date: '2026-09-21',
    productName: '박쥐란 비푸르카툼 목부작',
    saleAmount: 29000,
    fee: 2900,
    payoutAmount: 26100,
  },
];

// 내 정산 내역 → [{ settlementId, date, productName, saleAmount, fee, payoutAmount }]
export function getMySettlements() {
  if (USE_DUMMY) {
    return Promise.resolve({ data: { data: DUMMY_SETTLEMENTS } });
  }
  return client.get('/api/v1/settlements');
}
