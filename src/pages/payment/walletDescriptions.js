import { getMyInfo, getSeller } from '../../api/memberApi';
import { getOrder } from '../../api/orderApi';
import { getMySettlements } from '../../api/settlementApi';
import { getCashOuts } from '../../api/walletApi';
import { bankNameForLast4 } from '../../constants/banks';

// 예치금 거래 내역 설명 (상품명 · 판매자 · 계좌)
// 거래 응답(WalletTransactionResponse)에는 설명이 없고 refType · refId만 있어, refId로 다른 API를 불러 채움
// refId의 뜻 (BE payment WalletTransaction · PaymentService):
//   PAYMENT = orderId · SHIPPING_FEE · SHIPPING_FEE_REFUND = sellerOrderId · ORDER_ITEM_CANCEL_REFUND = orderItemId
//   SETTLEMENT · SETTLEMENT_FEE = settlementId · CASH_OUT = cashOutId
// 같은 id는 한 번만 부르고, 실패한 조회는 건너뜀 (그 자리는 자리 문구로 남음)
// TODO: 환불 사유는 어느 API에도 없음 · 배송비 거래의 판매자는 같은 주문의 결제 거래가 목록에 있을 때만 찾음

const CASH_OUT_FETCH_SIZE = 100;

function unwrap(response) {
  return response.data.data ?? response.data;
}

function uniqueRefIds(transactions, refTypes) {
  return [
    ...new Set(
      transactions.filter((item) => refTypes.includes(item.refType) && item.refId != null).map((item) => item.refId),
    ),
  ];
}

// 여러 id를 한꺼번에 불러 Map(id → 응답)으로. 실패한 id는 빠짐
async function loadEach(ids, load) {
  const results = await Promise.allSettled(ids.map((id) => load(id)));
  const map = new Map();
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') map.set(ids[index], unwrap(result.value));
  });
  return map;
}

async function loadOrNull(needed, load) {
  if (!needed) return null;
  try {
    return unwrap(await load());
  } catch {
    return null;
  }
}

/**
 * 거래 목록 → 설명을 만들 때 쓰는 참조 값
 * → { orders: Map(orderId → 주문 상세), sellerOrderSellers: Map(sellerOrderId → sellerId),
 *     orderItemNames: Map(orderItemId → 상품명), sellerNames: Map(sellerId → 닉네임),
 *     settlementNames: Map(settlementId → 상품명), cashOutLast4: Map(cashOutId → 계좌 끝 4자리), myAccount }
 */
export async function loadDescriptionRefs(transactions) {
  const has = (types) => transactions.some((item) => types.includes(item.refType));
  const orderIds = uniqueRefIds(transactions, ['PAYMENT']);

  const [orders, settlements, cashOutPage, myInfo] = await Promise.all([
    loadEach(orderIds, getOrder),
    loadOrNull(has(['SETTLEMENT', 'SETTLEMENT_FEE']), getMySettlements),
    loadOrNull(has(['CASH_OUT']), () => getCashOuts({ size: CASH_OUT_FETCH_SIZE })),
    loadOrNull(has(['CASH_OUT']), getMyInfo),
  ]);

  // 주문 상세에서 판매 주문 → 판매자, 주문상품 → 상품명
  const sellerOrderSellers = new Map();
  const orderItemNames = new Map();
  orders.forEach((order) => {
    (order.sellerOrders ?? []).forEach((sellerOrder) => {
      sellerOrderSellers.set(sellerOrder.id, sellerOrder.sellerId);
      (sellerOrder.items ?? []).forEach((orderItem) => orderItemNames.set(orderItem.id, orderItem.productName));
    });
  });

  // 배송비 거래의 판매자 닉네임 (GET /api/v1/sellers/{sellerId})
  const sellerIds = [
    ...new Set(
      uniqueRefIds(transactions, ['SHIPPING_FEE', 'SHIPPING_FEE_REFUND'])
        .map((sellerOrderId) => sellerOrderSellers.get(sellerOrderId))
        .filter((sellerId) => sellerId != null),
    ),
  ];
  const sellers = await loadEach(sellerIds, getSeller);
  const sellerNames = new Map([...sellers].map(([sellerId, seller]) => [sellerId, seller?.nickname]));

  const settlementNames = new Map((settlements ?? []).map((item) => [item.settlementId, item.productName]));
  const cashOutLast4 = new Map((cashOutPage?.content ?? []).map((item) => [item.cashOutId, item.accountLast4]));

  return {
    orders,
    sellerOrderSellers,
    orderItemNames,
    sellerNames,
    settlementNames,
    cashOutLast4,
    myAccount: myInfo?.account ?? null,
  };
}

// 값이 있으면 그 값, 없으면 자리 문구
const or = (value, placeholder) => (value ? value : placeholder);

/**
 * 거래 하나 → 설명. 이 거래 종류를 여기서 만들지 않으면 null (화면 기본 문구를 씀)
 */
export function describeTransaction(item, refs) {
  if (!refs) return null;
  const { refId } = item;
  switch (item.refType) {
    case 'PAYMENT': {
      const order = refs.orders.get(refId);
      const first = order?.sellerOrders?.[0]?.items?.[0]?.productName;
      if (!first) return null;
      const others = (order.itemCount ?? 1) - 1;
      return others > 0 ? `${first} 외 ${others}개` : first;
    }
    case 'SHIPPING_FEE':
    case 'SHIPPING_FEE_REFUND': {
      const seller = refs.sellerNames.get(refs.sellerOrderSellers.get(refId));
      if (!seller) return null;
      return item.refType === 'SHIPPING_FEE' ? `${seller} 배송비` : `${seller} 배송비 환불`;
    }
    case 'ORDER_ITEM_CANCEL_REFUND': {
      const name = refs.orderItemNames.get(refId);
      return name ? `${name} · {환불 사유}` : null;
    }
    case 'SETTLEMENT':
    case 'SETTLEMENT_FEE': {
      const name = refs.settlementNames.get(refId);
      if (!name) return null;
      return item.refType === 'SETTLEMENT' ? `${name} 판매 정산` : `${name} 정산 수수료`;
    }
    case 'CASH_OUT': {
      const last4 = refs.cashOutLast4.get(refId);
      if (!last4) return null;
      const bank = bankNameForLast4(last4, refs.myAccount);
      return `${or(bank, '{은행}')} ***${last4} 계좌로 인출`;
    }
    default:
      return null;
  }
}
